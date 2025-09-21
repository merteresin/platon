import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '../_utils/auth';

export async function GET(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;

  const [rows]: any = await pool.query(
    `SELECT id, user_id, type, amount, currency, status, description, created_at
     FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [u.userId]
  );
  return NextResponse.json({ transactions: rows || [] });
}
