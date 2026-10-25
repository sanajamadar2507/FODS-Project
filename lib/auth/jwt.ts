import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '../db/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'relieflink-secret-key-disaster-relief-secure-2026'
);

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  [key: string]: any;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}
