import api from "./api";

export interface Document {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url: string | null;
  tags: string[];
  version: number;
  created_at: string;
  updated_at: string;
  created_by: { id: number; name: string } | null;
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  version: number;
  file_name: string;
  file_size: number;
  file_url: string | null;
  notes: string | null;
  created_at: string;
  created_by: { id: number; name: string } | null;
}

export async function getDocuments(
  params?: Record<string, string | number>
): Promise<Document[]> {
  const res = await api.get<{ data: Document[] }>("/documents", { params });
  return res.data.data;
}

export async function getDocument(id: number): Promise<Document> {
  const res = await api.get<{ data: Document }>(`/documents/${id}`);
  return res.data.data;
}

export async function getDocumentVersions(id: number): Promise<DocumentVersion[]> {
  const res = await api.get<{ data: DocumentVersion[] }>(`/documents/${id}/versions`);
  return res.data.data;
}

export async function createDocument(payload: {
  file: File;
  title: string;
  description?: string;
  category?: string;
  tags?: string;
}): Promise<Document> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);
  if (payload.category) form.append("category", payload.category);
  if (payload.tags) form.append("tags", payload.tags);
  const res = await api.post<{ data: Document }>("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function uploadNewVersion(
  id: number,
  file: File,
  notes?: string
): Promise<DocumentVersion> {
  const form = new FormData();
  form.append("file", file);
  if (notes) form.append("notes", notes);
  const res = await api.post<{ data: DocumentVersion }>(`/documents/${id}/version`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`);
}
