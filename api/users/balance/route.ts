import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '../../_utils/auth';

export async function GET(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;

  const [rows]: any = await pool.query(
    `SELECT currency, balance FROM user_balances WHERE user_id = ?`,
    [u.userId]
  );
  return NextResponse.json({ balances: rows || [] });
}
