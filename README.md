# CollabMind

A real-time collaborative document editor with AI-powered writing assistance, built entirely on Cloudflare's developer platform. Multiple users edit the same document simultaneously with live cursors, CRDT-based conflict resolution, inline AI suggestions, and a context-aware AI chat sidebar.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Pages)                    │
│  React + TipTap + Yjs + Tailwind                      │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ Editor   │  │ Presence │  │ AI Chat Panel      │   │
│  │ (TipTap) │  │ Bar      │  │ (streaming)        │   │
│  └────┬─────┘  └────┬─────┘  └────────┬───────────┘   │
│       │              │                 │               │
└───────┼──────────────┼─────────────────┼───────────────┘
        │ WebSocket    │ Awareness       │ HTTP POST
        │ (Yjs CRDT)  │ (y-websocket)   │ (SSE stream)
        ▼              ▼                 ▼
┌──────────────────────────────────────────────────────┐
│                  Backend (Workers)                     │
│                                                        │
│  ┌───────────────────────────────────────────────┐    │
│  │           Worker (Router / index.ts)           │    │
│  │  /doc/:id → DO  │  /create  │  /ai-chat → AI  │    │
│  └────────┬────────────────────────────┬──────────┘    │
│           │                            │               │
│  ┌────────▼────────┐      ┌───────────▼──────────┐    │
│  │ DocumentAgent   │      │  Workers AI          │    │
│  │ (Durable Object)│      │  @cf/meta/llama-3.1  │    │
│  │                 │      │  -8b-instruct        │    │
│  │ • Yjs state     │      └──────────────────────┘    │
│  │ • WebSocket hub │                                   │
│  │ • Persistence   │                                   │
│  └─────────────────┘                                   │
└──────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- Cloudflare account (free tier works)
- Logged in to Wrangler: `wrangler login`

## Setup

### 1. Clone and install

```bash
git clone <repo-url> collabmind
cd collabmind

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Create KV namespace

```bash
cd backend
wrangler kv namespace create SESSIONS
```

Copy the output `id` and update `backend/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "<your-kv-namespace-id>"
```

### 3. Configure Google OAuth (optional but recommended)

CollabMind supports two sign-in modes: **Google** and **guest**. Without Google credentials, only guest mode works.

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials → OAuth client ID** (configure the OAuth consent screen first if prompted)
3. Application type: **Web application**
4. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://collabmind.pages.dev` (your production frontend, if any)
5. Authorized redirect URIs:
   - `http://localhost:8787/auth/google/callback`
   - `https://collabmind-backend.<you>.workers.dev/auth/google/callback` (production)
6. Copy the **Client ID** and **Client Secret**.

For local dev, create `backend/.dev.vars` (gitignored) from the template:

```bash
cd backend
cp .dev.vars.example .dev.vars
# Edit .dev.vars and paste your credentials
```

For production, set them as Wrangler secrets:

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### 4. Run locally

In two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Starts on http://localhost:8787

# Terminal 2 — Frontend
cd frontend
npm run dev
# Starts on http://localhost:5173
```

### 5. Deploy to Cloudflare

```bash
# Deploy backend
cd backend
wrangler deploy
# Note the deployed URL, e.g. https://collabmind-backend.<you>.workers.dev

# Update frontend env
cd ../frontend
echo "VITE_BACKEND_URL=https://collabmind-backend.<you>.workers.dev" > .env.production

# Build and deploy frontend
npm run build
wrangler pages deploy dist --project-name collabmind
```

## Usage

1. Open the app and click **Create New Document**
2. Enter your name — you'll join the editor
3. Copy the URL and share it with collaborators
4. Type together in real-time — you'll see each other's cursors
5. Pause typing for 2 seconds to get an AI writing suggestion (press Tab to accept)
6. Click **AI Chat** to open the sidebar and ask questions about your document

## Cloudflare Products Used

| Product | Purpose |
|---------|---------|
| **Workers** | HTTP router, API endpoints, WebSocket upgrade |
| **Durable Objects** | Per-document state (Yjs CRDT), WebSocket hub, persistence |
| **Workers AI** | Inline writing suggestions and document Q&A chat |
| **AI Gateway** | Rate limiting, logging, caching for AI calls |
| **KV** | Session metadata storage |
| **Pages** | Frontend hosting with global CDN |
