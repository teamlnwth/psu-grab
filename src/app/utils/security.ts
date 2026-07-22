/**
 * Security Utility Functions for CampusGo (PSU Grab)
 */

const SALT = 'campusgo_secure_salt_2026_psu';

/**
 * Hashes a plaintext password using SHA-256 with a salt.
 * Ensures passwords stored in database and transferred over network are not in plaintext.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitizes user input string to mitigate basic XSS attacks.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
