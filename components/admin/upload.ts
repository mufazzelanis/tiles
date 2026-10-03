/** Upload files to the media library and return their public URLs. */
export async function uploadFiles(files: FileList | File[]): Promise<string[]> {
  const body = new FormData();
  for (const f of Array.from(files)) body.append("file", f);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json.urls as string[];
}
