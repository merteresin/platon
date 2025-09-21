import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '../../_utils/auth';
import { toUSD } from '../../_utils/pricing';

export async function POST(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;

  const body = await req.json();
  const amount = Number(body.amount || 0);
  const currency = String(body.currency || 'USDT').toUpperCase();
  const description = body.description ?? null;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Geçersiz tutar' }, { status: 400 });
  }

  // Log transaction
  const [res]: any = await pool.query(
    `INSERT INTO transactions (user_id, type, amount, currency, status, description, created_at, updated_at)
     VALUES (?, 'deposit', ?, ?, 'completed', ?, NOW(), NOW())`,
    [u.userId, amount, currency, description]
  );

  // Convert to USD and update unified USDT balance
  const usd = await toUSD(amount, currency);
  await pool.query(
    `INSERT INTO user_balances (user_id, currency, balance, last_updated)
     VALUES (?, 'USDT', ?, NOW())
     ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), last_updated = NOW()`,
    [u.userId, usd]
  );

  return NextResponse.json({ success: true, transaction_id: res.insertId, credited_usd: usd });
}
