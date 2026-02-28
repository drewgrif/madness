import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id } = await params;
  const { name, short_name, seed, region, color } = await req.json();
  const rows = await sql`
    UPDATE teams SET name=${name}, short_name=${short_name}, seed=${seed}, region=${region}, color=${color}
    WHERE id=${parseInt(id)} RETURNING *
  `;
  return NextResponse.json(rows[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id } = await params;
  await sql`DELETE FROM teams WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ ok: true });
}
