export const ADMIN_EMAILS = new Set(['oz@oz.com']);

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}
