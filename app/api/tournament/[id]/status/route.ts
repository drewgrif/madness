import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, picks_locked } = body;

  const rows = await sql`SELECT * FROM tournaments WHERE id = ${parseInt(id)}`;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (status !== undefined && picks_locked !== undefined) {
    await sql`UPDATE tournaments SET status = ${status}, picks_locked = ${picks_locked} WHERE id = ${parseInt(id)}`;
  } else if (status !== undefined) {
    await sql`UPDATE tournaments SET status = ${status} WHERE id = ${parseInt(id)}`;
  } else if (picks_locked !== undefined) {
    await sql`UPDATE tournaments SET picks_locked = ${picks_locked} WHERE id = ${parseInt(id)}`;
  }

  const updated = await sql`SELECT * FROM tournaments WHERE id = ${parseInt(id)}`;
  return NextResponse.json(updated[0]);
}
