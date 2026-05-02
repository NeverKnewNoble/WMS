import { toast } from "sonner";
import { ApiError, rethrow } from "./http";

/**
 * Show an error toast for a thrown service error. Safe to call from
 * server contexts: it no-ops when `window` is undefined.
 *
 * The toast title is the friendly fallback ("Could not load items").
 * The description is the underlying error message ("Not authenticated",
 * "Validation failed", etc.) so the user sees both pieces.
 */
export function showApiErrorToast(err: unknown, fallback: string) {
  if (typeof window === "undefined") return;

  const description =
    err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : String(err);

  toast.error(fallback, {
    description: description !== fallback ? description : undefined,
  });
}

/**
 * Show an error toast and rethrow as an ApiError. Use this inside a
 * service's `catch` block:
 *
 *   try {
 *     return await http.get(...);
 *   } catch (err) {
 *     failWithToast(err, "Could not load items");
 *   }
 *
 * Returns `never`, so TypeScript correctly narrows the return type of
 * the calling function.
 */
export function failWithToast(err: unknown, fallback: string): never {
  showApiErrorToast(err, fallback);
  rethrow(err, fallback);
}

/** Convenience: show a success toast. Use sparingly. */
export function showSuccessToast(message: string, description?: string) {
  if (typeof window === "undefined") return;
  toast.success(message, { description });
}
