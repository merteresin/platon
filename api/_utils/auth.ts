import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export type AuthUser = { userId: number; email: string; is_admin?: boolean };

export function signToken(payload: AuthUser) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token?: string): AuthUser | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): AuthUser | NextResponse {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

export function requireAdmin(req: NextRequest): AuthUser | NextResponse {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;
  if (!u.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return u;
}
