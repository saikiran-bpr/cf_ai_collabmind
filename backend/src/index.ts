import type {
  Env,
  AIChatRequest,
  SessionData,
  GoogleTokenResponse,
  GoogleProfile,
  DocMeta,
  UserDocEntry,
} from "./types";

export { DocumentAgent } from "./DocumentAgent";

const SESSION_TTL = 86400; // 24h
const OAUTH_STATE_TTL = 600; // 10 min

const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
];

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function pickColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function isAllowedRedirect(url: string, allowedOrigins: string): boolean {
  try {
    const parsed = new URL(url);
    const allowed = allowedOrigins.split(",").map((o) => o.trim());
    return allowed.some((o) => parsed.origin === o);
  } catch {
    return false;
  }
}

async function getAuthSession(
  request: Request,
  env: Env
): Promise<{ sessionId: string; session: SessionData } | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const sessionId = auth.slice(7).trim();
  if (!sessionId) return null;
  const raw = await env.SESSIONS.get(sessionId);
  if (!raw) return null;
  return { sessionId, session: JSON.parse(raw) as SessionData };
}

async function trackUserDoc(
  env: Env,
  userId: string,
  docId: string,
  role: "owner" | "shared"
): Promise<void> {
  const key = `userdoc:${userId}:${docId}`;
  const existing = await env.SESSIONS.get(key);
  if (existing) return; // don't downgrade owner → shared
  const entry: UserDocEntry = { docId, role, addedAt: Date.now() };
  await env.SESSIONS.put(key, JSON.stringify(entry));
}

async function createGoogleSession(
  env: Env,
  profile: GoogleProfile
): Promise<{ sessionId: string; session: SessionData }> {
  const sessionId = `sess_${crypto.randomUUID()}`;
  const session: SessionData = {
    userId: `google_${profile.id}`,
    name: profile.name || profile.email,
    email: profile.email,
    picture: profile.picture,
    color: pickColor(),
    provider: "google",
    createdAt: Date.now(),
  };
  await env.SESSIONS.put(sessionId, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
  });
  return { sessionId, session };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = url.origin;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      // ── Health ──
      if (path === "/health" && request.method === "GET") {
        return jsonResponse({ status: "ok", timestamp: Date.now() });
      }

      // ── Auth config (frontend uses to know what's enabled) ──
      if (path === "/auth/config" && request.method === "GET") {
        return jsonResponse({
          google: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
        });
      }

      // ── Begin Google OAuth ──
      if (path === "/auth/google" && request.method === "GET") {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
          return jsonResponse({ error: "Google OAuth not configured" }, 500);
        }

        const redirect = url.searchParams.get("redirect") ?? "";
        if (!redirect || !isAllowedRedirect(redirect, env.ALLOWED_ORIGINS)) {
          return jsonResponse({ error: "Invalid redirect URL" }, 400);
        }

        const state = crypto.randomUUID();
        await env.SESSIONS.put(
          `oauth_state_${state}`,
          JSON.stringify({ redirect }),
          { expirationTtl: OAUTH_STATE_TTL }
        );

        const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
        googleUrl.searchParams.set("redirect_uri", `${origin}/auth/google/callback`);
        googleUrl.searchParams.set("response_type", "code");
        googleUrl.searchParams.set("scope", "openid email profile");
        googleUrl.searchParams.set("state", state);
        googleUrl.searchParams.set("access_type", "online");
        googleUrl.searchParams.set("prompt", "select_account");

        return Response.redirect(googleUrl.toString(), 302);
      }

      // ── Google OAuth callback ──
      if (path === "/auth/google/callback" && request.method === "GET") {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
          return jsonResponse({ error: "Google OAuth not configured" }, 500);
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          return new Response(`Google sign-in failed: ${error}`, {
            status: 400,
            headers: corsHeaders(),
          });
        }

        if (!code || !state) {
          return jsonResponse({ error: "Missing code or state" }, 400);
        }

        const stateRaw = await env.SESSIONS.get(`oauth_state_${state}`);
        if (!stateRaw) {
          return jsonResponse({ error: "Invalid or expired state" }, 400);
        }
        await env.SESSIONS.delete(`oauth_state_${state}`);

        const { redirect } = JSON.parse(stateRaw) as { redirect: string };

        // Exchange code for token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${origin}/auth/google/callback`,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) {
          return jsonResponse({ error: "Token exchange failed" }, 502);
        }

        const tokens = (await tokenRes.json()) as GoogleTokenResponse;

        // Fetch profile
        const profileRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          { headers: { Authorization: `Bearer ${tokens.access_token}` } }
        );

        if (!profileRes.ok) {
          return jsonResponse({ error: "Failed to fetch profile" }, 502);
        }

        const profile = (await profileRes.json()) as GoogleProfile;
        const { sessionId } = await createGoogleSession(env, profile);

        const finalUrl = new URL(redirect);
        finalUrl.searchParams.set("session", sessionId);
        return Response.redirect(finalUrl.toString(), 302);
      }

      // ── Create document (requires auth) ──
      if (path === "/create" && request.method === "POST") {
        const auth = await getAuthSession(request, env);
        if (!auth) return jsonResponse({ error: "Sign in required" }, 401);

        const docId = crypto.randomUUID();
        const now = Date.now();
        const meta: DocMeta = {
          docId,
          title: "Untitled",
          createdBy: auth.session.userId,
          createdByName: auth.session.name,
          createdAt: now,
          lastModified: now,
        };
        await env.SESSIONS.put(`doc:${docId}`, JSON.stringify(meta));
        await trackUserDoc(env, auth.session.userId, docId, "owner");

        return jsonResponse({ docId, url: `/doc/${docId}` });
      }

      // ── List user's documents ──
      if (path === "/my-docs" && request.method === "GET") {
        const auth = await getAuthSession(request, env);
        if (!auth) return jsonResponse({ error: "Sign in required" }, 401);

        const list = await env.SESSIONS.list({
          prefix: `userdoc:${auth.session.userId}:`,
        });

        const entries = await Promise.all(
          list.keys.map(async (k) => {
            const raw = await env.SESSIONS.get(k.name);
            if (!raw) return null;
            const entry = JSON.parse(raw) as UserDocEntry;
            const metaRaw = await env.SESSIONS.get(`doc:${entry.docId}`);
            const meta = metaRaw ? (JSON.parse(metaRaw) as DocMeta) : null;
            if (!meta) return null;
            return {
              docId: entry.docId,
              role: entry.role,
              addedAt: entry.addedAt,
              title: meta.title,
              createdBy: meta.createdBy,
              createdByName: meta.createdByName,
              createdAt: meta.createdAt,
              lastModified: meta.lastModified,
            };
          })
        );

        const docs = entries
          .filter((e): e is NonNullable<typeof e> => e !== null)
          .sort((a, b) => b.lastModified - a.lastModified);

        return jsonResponse({ docs });
      }

      // ── Create guest session ──
      if (path === "/session" && request.method === "POST") {
        const body = (await request.json()) as { name?: string };
        const name = (body.name ?? "").trim() || "Anonymous";

        const sessionId = `sess_${crypto.randomUUID()}`;
        const session: SessionData = {
          userId: `guest_${crypto.randomUUID()}`,
          name,
          color: pickColor(),
          provider: "guest",
          createdAt: Date.now(),
        };

        await env.SESSIONS.put(sessionId, JSON.stringify(session), {
          expirationTtl: SESSION_TTL,
        });

        return jsonResponse({ sessionId, ...session });
      }

      // ── Get / validate session ──
      const sessionMatch = path.match(/^\/session\/(.+)$/);
      if (sessionMatch && request.method === "GET") {
        const sessionId = sessionMatch[1];
        const raw = await env.SESSIONS.get(sessionId);
        if (!raw) {
          return jsonResponse({ error: "Session not found or expired" }, 404);
        }
        const session = JSON.parse(raw) as SessionData;
        return jsonResponse({ sessionId, ...session });
      }

      // ── Document WebSocket + DO proxy ──
      const docMatch = path.match(/^\/doc\/([a-f0-9-]{36})$/);
      if (docMatch) {
        const docId = docMatch[1];

        if (request.headers.get("Upgrade") === "websocket") {
          const sessionId = url.searchParams.get("session");
          if (!sessionId) {
            return jsonResponse({ error: "Session required" }, 401);
          }

          const raw = await env.SESSIONS.get(sessionId);
          if (!raw) {
            return jsonResponse({ error: "Invalid or expired session" }, 401);
          }

          const session = JSON.parse(raw) as SessionData;

          // Ensure this doc has metadata + user is tracked
          const metaRaw = await env.SESSIONS.get(`doc:${docId}`);
          if (!metaRaw) {
            const now = Date.now();
            const meta: DocMeta = {
              docId,
              title: "Untitled",
              createdBy: session.userId,
              createdByName: session.name,
              createdAt: now,
              lastModified: now,
            };
            await env.SESSIONS.put(`doc:${docId}`, JSON.stringify(meta));
            await trackUserDoc(env, session.userId, docId, "owner");
          } else {
            const meta = JSON.parse(metaRaw) as DocMeta;
            await trackUserDoc(
              env,
              session.userId,
              docId,
              meta.createdBy === session.userId ? "owner" : "shared"
            );
          }

          const doUrl = new URL(request.url);
          doUrl.searchParams.set("userId", session.userId);
          doUrl.searchParams.set("name", session.name);
          doUrl.searchParams.set("color", session.color);
          doUrl.searchParams.set("docId", docId);
          doUrl.searchParams.delete("session");

          const id = env.DOCUMENT_AGENT.idFromName(docId);
          const stub = env.DOCUMENT_AGENT.get(id);
          return stub.fetch(new Request(doUrl.toString(), request));
        }

        const id = env.DOCUMENT_AGENT.idFromName(docId);
        const stub = env.DOCUMENT_AGENT.get(id);
        return stub.fetch(request);
      }

      // ── AI suggestion ──
      if (path === "/ai-suggest" && request.method === "POST") {
        const body = (await request.json()) as {
          context: string;
          paragraphContext: string;
          requestId: string;
        };

        try {
          const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              {
                role: "system",
                content:
                  "You are an inline writing assistant embedded in a collaborative document editor. " +
                  "Your job is to suggest the next sentence only. " +
                  "Rules: " +
                  "1. Return ONLY the continuation text — no preamble, no explanation. " +
                  "2. Maximum 1 sentence (end with a period). " +
                  "3. Match the exact writing style, tone, and vocabulary of the input. " +
                  "4. If the text is formal, stay formal. If casual, stay casual. " +
                  "5. Never start with 'I' or repeat the last word of the input.",
              },
              { role: "user", content: body.paragraphContext.slice(-500) },
            ],
          });

          const text =
            typeof response === "object" &&
            response !== null &&
            "response" in (response as Record<string, unknown>)
              ? (response as Record<string, unknown>).response
              : String(response);

          return jsonResponse({ text: text ?? "", requestId: body.requestId });
        } catch {
          return jsonResponse({ text: "", requestId: body.requestId });
        }
      }

      // ── AI chat (streaming) ──
      if (path === "/ai-chat" && request.method === "POST") {
        const body = (await request.json()) as AIChatRequest;
        const { message, documentContext, conversationHistory } = body;

        const messages = [
          {
            role: "system" as const,
            content:
              "You are an intelligent writing assistant with full context of a collaborative document. " +
              "You help teams write better by answering questions about the document, " +
              "finding contradictions, summarizing sections, and suggesting improvements. " +
              "Always be specific — reference actual content from the document in your answers.\n\n" +
              "Document content:\n---\n" +
              (documentContext ?? "").slice(0, 6000) +
              "\n---",
          },
          ...conversationHistory.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: message },
        ];

        const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages,
          stream: true,
        });

        return new Response(response as unknown as ReadableStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            ...corsHeaders(),
          },
        });
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse(
        { error: err instanceof Error ? err.message : "Internal error" },
        500
      );
    }
  },
};
