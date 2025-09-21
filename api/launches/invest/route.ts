import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '../../_utils/auth';

export async function POST(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;
  const body = await req.json();
  const { launch_id, usd_amount } = body;

  if (!launch_id || !usd_amount || usd_amount <= 0) {
    return NextResponse.json({ error: 'Geçersiz parametre' }, { status: 400 });
  }

  // Check balance
  const [rows]: any = await pool.query(
    `SELECT balance FROM user_balances WHERE user_id = ? AND currency = 'USDT'`, [u.userId]
  );
  const bal = rows?.[0]?.balance ? Number(rows[0].balance) : 0;
  if (bal < Number(usd_amount)) {
    return NextResponse.json({ error: 'Yetersiz bakiye' }, { status: 400 });
  }

  // Get launch price
  const [lrows]: any = await pool.query(`SELECT id, price, symbol FROM launches WHERE id = ?`, [launch_id]);
  const launch = lrows?.[0];
  if (!launch) return NextResponse.json({ error: 'Launch bulunamadı' }, { status: 404 });

  const tokens = Number(usd_amount) / Number(launch.price);

  // Deduct balance, create transaction
  await pool.query(
    `UPDATE user_balances SET balance = balance - ?, last_updated = NOW()
     WHERE user_id = ? AND currency = 'USDT'`,
    [usd_amount, u.userId]
  );

  await pool.query(
    `INSERT INTO transactions (user_id, type, amount, currency, status, description, created_at, updated_at)
     VALUES (?, 'deposit', ?, ?, 'completed', ?, NOW(), NOW())`,
    [u.userId, tokens, String(launch.symbol).toUpperCase(), 'Launch invest']
  );

  return NextResponse.json({ success: true, tokens_acquired: tokens });
}
