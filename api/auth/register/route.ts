import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '../../_utils/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const username = String(body.username || email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email ve şifre gereklidir' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    const exists = Array.isArray(rows) && rows.length > 0;
    if (exists) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result]: any = await pool.query(
      `INSERT INTO users (username, email, password_hash, is_admin, created_at, updated_at)
       VALUES (?, ?, ?, 0, NOW(), NOW())`,
      [username, email, hash]
    );

    const userId = result.insertId;
    // initialize user balance in USD row
    await pool.query(
      `INSERT INTO user_balances (user_id, currency, balance, last_updated)
       VALUES (?, 'USDT', 0, NOW())
       ON DUPLICATE KEY UPDATE last_updated = NOW()`,
      [userId]
    );

    const token = signToken({ userId, email, is_admin: false });
    return NextResponse.json({ success: true, token, user: { id: userId, email, username } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Hata' }, { status: 500 });
  }
}
