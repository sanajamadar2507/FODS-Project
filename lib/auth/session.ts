import { cookies } from 'next/headers';
import { verifyToken, TokenPayload } from './jwt';
import { DatabaseStore } from '../db/store';
import { User } from '../db/types';

export const COOKIE_NAME = 'relieflink_session';

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return await DatabaseStore.getUserById(session.userId);
}
