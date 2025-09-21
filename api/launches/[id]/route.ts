import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin } from '../../_utils/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const [rows]: any = await pool.query(`SELECT * FROM launches WHERE id = ?`, [params.id]);
  const item = rows?.[0] ?? null;
  if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAdmin(req);
  if (u instanceof NextResponse) return u;
  const body = await req.json();

  await pool.query(
    `UPDATE launches SET
       name = COALESCE(?, name),
       symbol = COALESCE(?, symbol),
       price = COALESCE(?, price),
       category = COALESCE(?, category),
       description = COALESCE(?, description),
       image_url = COALESCE(?, image_url),
       status = COALESCE(?, status),
       updated_at = NOW()
     WHERE id = ?`,
    [body.name, body.symbol?.toUpperCase(), body.price, body.category, body.description, body.image_url, body.status, params.id]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAdmin(req);
  if (u instanceof NextResponse) return u;
  await pool.query(`DELETE FROM launches WHERE id = ?`, [params.id]);
  return NextResponse.json({ success: true });
}
