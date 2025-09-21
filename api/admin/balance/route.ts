import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin } from '../../_utils/auth';

export async function POST(req: NextRequest) {
  const u = requireAdmin(req);
  if (u instanceof NextResponse) return u;

  const { user_id, currency = 'USDT', amount } = await req.json();
  if (!user_id || !amount) return NextResponse.json({ error: 'user_id ve amount gereklidir' }, { status: 400 });

  await pool.query(
    `INSERT INTO user_balances (user_id, currency, balance, last_updated)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), last_updated = NOW()`,
    [Number(user_id), String(currency).toUpperCase(), Number(amount)]
  );
  return NextResponse.json({ success: true });
}
