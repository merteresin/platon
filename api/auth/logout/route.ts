import { NextResponse } from 'next/server';

export async function POST() {
  // JWT stateless; client-side token silinir.
  return NextResponse.json({ success: true });
}
