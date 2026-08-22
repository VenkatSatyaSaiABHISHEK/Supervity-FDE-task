export const API_BASE = "http://127.0.0.1:8000/api";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DocumentResponse {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'ppt' | 'image' | 'txt';
  status: 'Processing' | 'Indexed' | 'Failed';
  upload_date: string;
  tags: string[];
  summary?: string;
  collection_id?: string;
}

export interface CollectionResponse {
  id: string;
  name: string;
  description?: string;
  icon_type: string;
  created_at: string;
  updated_at: string;
  documents_count: number;
  progress: number;
}

export interface TicketMeta {
  category: string;
  category_confidence: number;
  retrieval_confidence: number;
  status: 'resolved' | 'escalated';
  escalation_reason: string;
  label: string;
  color: string;
}

export interface MessageResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations: string[];
  // Ticket triage metadata (assistant messages only)
  ticket_category?: string;
  ticket_category_confidence?: number;
  ticket_retrieval_confidence?: number;
  ticket_status?: string;
  ticket_escalation_reason?: string;
}

export interface ChatSessionResponse {
  id: string;
  title: string;
  date: string;
  messages: MessageResponse[];
  collection_id?: string;
}

export interface SystemSettingsResponse {
  active_model: string;
  ocr_enabled: boolean;
  ocr_language: string;
  chunk_size: number;
  chunk_overlap: number;
}

// ─── Collections API ──────────────────────────────────────────────────────────

export async function getCollections(): Promise<CollectionResponse[]> {
  const res = await fetch(`${API_BASE}/collections`);
  if (!res.ok) throw new Error("Failed fetching collections");
  return res.json();
}

export async function createCollection(name: string, description?: string, iconType?: string): Promise<CollectionResponse> {
  const res = await fetch(`${API_BASE}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, icon_type: iconType || "BookOpen" })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed creating collection"); }
  return res.json();
}

export async function deleteCollection(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/collections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed deleting collection");
  return res.json();
}

// ─── Documents API ────────────────────────────────────────────────────────────

export async function getDocuments(collectionId?: string): Promise<DocumentResponse[]> {
  const url = collectionId ? `${API_BASE}/documents?collection_id=${collectionId}` : `${API_BASE}/documents`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed fetching documents");
  return res.json();
}

export async function deleteDocument(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed deleting document");
  return res.json();
}

export async function uploadDocument(
  file: File,
  collectionId: string,
  onProgress?: (pct: number) => void
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("collection_id", collectionId);
  if (onProgress) { onProgress(20); setTimeout(() => onProgress(60), 300); }
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
  if (onProgress) onProgress(100);
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Upload failed"); }
  return res.json();
}

// ─── Settings API ─────────────────────────────────────────────────────────────

export async function getSettings(): Promise<SystemSettingsResponse> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error("Failed fetching settings");
  return res.json();
}

// ─── Chat / Ticket Sessions API ───────────────────────────────────────────────

export async function getChatSessions(): Promise<ChatSessionResponse[]> {
  const res = await fetch(`${API_BASE}/chat/sessions`);
  if (!res.ok) throw new Error("Failed fetching sessions");
  return res.json();
}

export async function createChatSession(title?: string): Promise<ChatSessionResponse> {
  const res = await fetch(`${API_BASE}/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title || "New Support Ticket" })
  });
  if (!res.ok) throw new Error("Failed creating session");
  return res.json();
}

export async function deleteChatSession(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/chat/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed deleting session");
  return res.json();
}

export async function updateChatSessionTitle(id: string, title: string): Promise<any> {
  const res = await fetch(`${API_BASE}/chat/sessions/${id}?title=${encodeURIComponent(title)}`, { method: "PUT" });
  if (!res.ok) throw new Error("Failed updating session title");
  return res.json();
}

// ─── Streaming Chat (with ticket metadata) ────────────────────────────────────

export async function streamChatMessage(
  sessionId: string,
  prompt: string,
  activeModel: string,
  onChunk: (token: string) => void,
  onTicketMeta: (meta: TicketMeta) => void,
  onCitations: (citations: string[]) => void,
  onComplete: () => void,
  onError: (err: any) => void,
  signal?: AbortSignal
) {
  try {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        prompt,
        model: activeModel,
        collection_id: "support-kb"
      }),
      signal
    });

    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No readable stream");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let firstPacket = true;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(cleaned.slice(6));

          if (firstPacket && data.category !== undefined) {
            // First packet carries ticket metadata
            onTicketMeta({
              category: data.category,
              category_confidence: data.category_confidence,
              retrieval_confidence: data.retrieval_confidence,
              status: data.status,
              escalation_reason: data.escalation_reason || "",
              label: data.label || data.category,
              color: data.color || "slate"
            });
            if (data.citations?.length > 0) onCitations(data.citations);
            firstPacket = false;
          } else if (data.token) {
            onChunk(data.token);
          }
        } catch (_) {}
      }
    }
    onComplete();
  } catch (err) {
    onError(err);
  }
}
