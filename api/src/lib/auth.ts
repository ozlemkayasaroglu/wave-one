import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'node:crypto';

// ── Password hashing (SHA-256 + salt via node:crypto) ─────────────────────────

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const attempt = createHash('sha256').update(salt + password).digest('hex');
  return attempt === hash;
}

// ── JWT ───────────────────────────────────────────────────────────────────────

function getSecret(jwtSecret: string) {
  return new TextEncoder().encode(jwtSecret);
}

export async function signToken(payload: { userId: string; email: string }, jwtSecret: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('90d')
    .sign(getSecret(jwtSecret));
}

export async function verifyToken(token: string, jwtSecret: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(jwtSecret));
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}
