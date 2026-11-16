export async function csrfHeaders(): Promise<Record<string, string>> {
  const match = document.cookie.match(/(?:^|;\s*)applyora_csrf=([^;]+)/);
  if (match?.[1]) return { "X-CSRF-Token": decodeURIComponent(match[1]) };
  await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
  const refreshed = document.cookie.match(/(?:^|;\s*)applyora_csrf=([^;]+)/);
  return refreshed?.[1] ? { "X-CSRF-Token": decodeURIComponent(refreshed[1]) } : {};
}
