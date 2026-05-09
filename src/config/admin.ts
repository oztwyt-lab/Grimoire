export const ADMIN_EMAILS = new Set(['oztwyt@gmail.com', 'app.grimoire@gmail.com']);

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}
