// Tiny browser-side helpers for binary downloads + multipart uploads.
// Lives outside http.ts because that wrapper is JSON-only and we don't
// want to muddy its types with Blob/FormData edge cases.

export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * POST a single file under the field name "file" and parse the JSON response.
 * On non-2xx, throws an Error whose message is the server's `error` field
 * (when present) so callers can surface it directly in a toast.
 */
export async function postFileForJson<T>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(path, {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      parsed && typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return parsed as T;
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
