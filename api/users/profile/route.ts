import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAuth } from '../../_utils/auth';

export async function GET(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;

  const [rows]: any = await pool.query(
    `SELECT id, username, email, full_name, phone, birth_date, status, is_admin, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`, [u.userId]
  );
  return NextResponse.json({ profile: rows?.[0] ?? null });
}

export async function PATCH(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof NextResponse) return u;

  const body = await req.json();
  const full_name = body.full_name ?? null;
  const phone = body.phone ?? null;

  await pool.query(
    `UPDATE users SET full_name = ?, phone = ?, updated_at = NOW() WHERE id = ?`,
    [full_name, phone, u.userId]
  );
  return NextResponse.json({ success: true });
}
