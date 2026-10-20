/**
 * Validates a post-sign-in `next` target.
 *
 * Sign-in flows carry the page the user came from through an OAuth redirect,
 * which means the value round-trips through a URL an attacker can craft. Only
 * same-site absolute paths are allowed — anything scheme-relative ("//evil.com",
 * which `new URL` resolves to another host) or absolute is discarded, so the
 * parameter can't be used to bounce users off-site after a real sign-in.
 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
