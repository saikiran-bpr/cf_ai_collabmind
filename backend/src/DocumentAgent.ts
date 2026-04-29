import { DurableObject } from "cloudflare:workers";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import type { Env, DocMeta } from "./types";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

export class DocumentAgent extends DurableObject<Env> {
  private ydoc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;
  private connections: Set<WebSocket>;
  private wsClientIds: Map<WebSocket, Set<number>>;
  private initialized: boolean;
  private pendingSave: boolean;
  private docId: string | null;
  private titleSyncTimer: ReturnType<typeof setTimeout> | null;
  private lastSyncedTitle: string;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ydoc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.ydoc);
    this.connections = new Set();
    this.wsClientIds = new Map();
    this.initialized = false;
    this.pendingSave = false;
    this.docId = null;
    this.titleSyncTimer = null;
    this.lastSyncedTitle = "";

    const meta = this.ydoc.getMap("meta");
    meta.observe(() => {
      const title = (meta.get("title") as string) ?? "";
      if (title === this.lastSyncedTitle) return;
      if (this.titleSyncTimer) clearTimeout(this.titleSyncTimer);
      this.titleSyncTimer = setTimeout(() => {
        this.flushTitleToKV(title).catch((err) =>
          console.error("Failed to sync title:", err)
        );
      }, 800);
    });

    this.ydoc.on("update", (update: Uint8Array, origin: unknown) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const msg = encoding.toUint8Array(encoder);
      const exclude = origin instanceof WebSocket ? origin : undefined;
      this.broadcastBinary(msg, exclude);
      this.pendingSave = true;
    });

    this.awareness.on(
      "update",
      (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown
      ) => {
        const changed = [...added, ...updated, ...removed];
        if (changed.length === 0) return;

        if (origin instanceof WebSocket) {
          let ids = this.wsClientIds.get(origin);
          if (!ids) {
            ids = new Set();
            this.wsClientIds.set(origin, ids);
          }
          for (const id of added) ids.add(id);
          for (const id of updated) ids.add(id);
        }

        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed)
        );
        this.broadcastBinary(encoding.toUint8Array(encoder));
      }
    );
  }

  private async flushTitleToKV(title: string): Promise<void> {
    if (!this.docId) return;
    try {
      const raw = await this.env.SESSIONS.get(`doc:${this.docId}`);
      if (!raw) return;
      const meta = JSON.parse(raw) as DocMeta;
      const trimmed = title.trim() || "Untitled";
      meta.title = trimmed;
      meta.lastModified = Date.now();
      await this.env.SESSIONS.put(`doc:${this.docId}`, JSON.stringify(meta));
      this.lastSyncedTitle = title;
    } catch (err) {
      console.error("flushTitleToKV error:", err);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    try {
      const savedState = await this.ctx.storage.get<ArrayBuffer>("docState");
      if (savedState) {
        Y.applyUpdate(this.ydoc, new Uint8Array(savedState));
      }
    } catch (err) {
      console.error("Failed to load saved state:", err);
    }
  }

  private broadcastBinary(msg: Uint8Array, exclude?: WebSocket): void {
    for (const ws of this.connections) {
      if (ws === exclude) continue;
      try {
        ws.send(msg);
      } catch {
        this.connections.delete(ws);
        this.wsClientIds.delete(ws);
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const url = new URL(request.url);
    if (!this.docId) {
      this.docId = url.searchParams.get("docId") ?? null;
    }

    await this.ensureInitialized();

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.ctx.acceptWebSocket(server);
    this.connections.add(server);

    // y-websocket protocol: send syncStep1 (our state vector) to new client
    {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeSyncStep1(encoder, this.ydoc);
      server.send(encoding.toUint8Array(encoder));
    }

    // Send current awareness states to the new client
    const states = this.awareness.getStates();
    if (states.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          Array.from(states.keys())
        )
      );
      server.send(encoding.toUint8Array(encoder));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.ensureInitialized();

    if (typeof message === "string") {
      this.handleJsonMessage(ws, message);
      return;
    }

    try {
      const data = new Uint8Array(message);
      const decoder = decoding.createDecoder(data);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, this.ydoc, ws);
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness,
            decoding.readVarUint8Array(decoder),
            ws
          );
          break;
        }
      }
    } catch (err) {
      console.error("Error processing binary message:", err);
    }

    if (this.pendingSave) {
      this.pendingSave = false;
      try {
        const state = Y.encodeStateAsUpdate(this.ydoc);
        await this.ctx.storage.put("docState", state.buffer.slice(
          state.byteOffset,
          state.byteOffset + state.byteLength
        ));
      } catch (err) {
        console.error("Failed to persist doc state:", err);
      }
    }
  }

  private handleJsonMessage(ws: WebSocket, message: string): void {
    let parsed: { type: string; [key: string]: unknown };
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    if (parsed.type === "ping") {
      try {
        ws.send(JSON.stringify({ type: "pong" }));
      } catch {
        this.connections.delete(ws);
        this.wsClientIds.delete(ws);
      }
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.connections.delete(ws);

    const clientIds = this.wsClientIds.get(ws);
    if (clientIds && clientIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        Array.from(clientIds),
        null
      );
    }
    this.wsClientIds.delete(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }
}
