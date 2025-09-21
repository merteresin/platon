import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin } from '../../_utils/auth';

export async function GET(req: NextRequest) {
  const u = requireAdmin(req);
  if (u instanceof NextResponse) return u;

  const [rows]: any = await pool.query(
    `SELECT * FROM transactions ORDER BY created_at DESC`
  );
  return NextResponse.json({ transactions: rows || [] });
}
