export interface Env {
  DOCUMENT_AGENT: DurableObjectNamespace;
  SESSIONS: KVNamespace;
  AI: Ai;
  ALLOWED_ORIGINS: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export interface SessionData {
  userId: string;
  name: string;
  color: string;
  email?: string;
  picture?: string;
  provider: "google" | "guest";
  createdAt: number;
}

export interface DocMeta {
  docId: string;
  title: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  lastModified: number;
}

export interface UserDocEntry {
  docId: string;
  role: "owner" | "shared";
  addedAt: number;
}

export interface AIChatRequest {
  message: string;
  documentContext: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export interface GoogleProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}
