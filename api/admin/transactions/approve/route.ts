import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin } from '../../../_utils/auth';

export async function POST(req: NextRequest) {
  const u = requireAdmin(req);
  if (u instanceof NextResponse) return u;

  const { id, status = 'completed' } = await req.json();
  if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 });

  await pool.query(`UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?`, [status, id]);
  return NextResponse.json({ success: true });
}
