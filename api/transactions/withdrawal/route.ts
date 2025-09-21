import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '../../_utils/auth';

export async function POST(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;

  const body = await req.json();
  const amount = Number(body.amount || 0);
  const description = body.description ?? null;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Geçersiz tutar' }, { status: 400 });
  }

  // Check USD balance
  const [rows]: any = await pool.query(
    `SELECT balance FROM user_balances WHERE user_id = ? AND currency = 'USDT'`,
    [u.userId]
  );
  const bal = rows?.[0]?.balance ? Number(rows[0].balance) : 0;
  if (bal < amount) {
    return NextResponse.json({ error: 'Yetersiz bakiye' }, { status: 400 });
  }

  // Create transaction and reduce balance
  const [res]: any = await pool.query(
    `INSERT INTO transactions (user_id, type, amount, currency, status, description, created_at, updated_at)
     VALUES (?, 'withdrawal', ?, 'USDT', 'completed', ?, NOW(), NOW())`,
    [u.userId, amount, description]
  );
  await pool.query(
    `UPDATE user_balances SET balance = balance - ?, last_updated = NOW()
     WHERE user_id = ? AND currency = 'USDT'`,
    [amount, u.userId]
  );

  return NextResponse.json({ success: true, transaction_id: res.insertId });
}
