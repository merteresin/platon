import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '../../_utils/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');

    const [rows]: any = await pool.query(
      `SELECT id, email, password_hash, is_admin FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = rows?.[0];
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 400 });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Geçersiz şifre' }, { status: 400 });
    }

    const token = signToken({ userId: user.id, email: user.email, is_admin: !!user.is_admin });
    return NextResponse.json({ success: true, token, user: { id: user.id, email: user.email, is_admin: !!user.is_admin } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Hata' }, { status: 500 });
  }
}
