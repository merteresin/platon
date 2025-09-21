import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin } from '../_utils/auth';

export async function GET() {
  const [rows]: any = await pool.query(
    `SELECT id, name, symbol, price, status, category, description, image_url, created_at
     FROM launches ORDER BY created_at DESC`
  );
  return NextResponse.json({ launches: rows || [] });
}

export async function POST(req: NextRequest) {
  const u = requireAdmin(req);
  if (u instanceof NextResponse) return u;

  const body = await req.json();
  const { name, symbol, price, category, description, image_url, status = 'active' } = body;

  if (!name || !symbol || !price) {
    return NextResponse.json({ error: 'name, symbol, price zorunlu' }, { status: 400 });
  }

  const [res]: any = await pool.query(
    `INSERT INTO launches (name, symbol, price, category, description, image_url, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [name, symbol.toUpperCase(), Number(price), category ?? null, description ?? null, image_url ?? null, status, u.userId]
  );
  return NextResponse.json({ success: true, id: res.insertId });
}
