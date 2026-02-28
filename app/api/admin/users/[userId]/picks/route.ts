import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get('tournament_id');
  if (!tournamentId) return NextResponse.json({ error: 'tournament_id required' }, { status: 400 });

  const uid = parseInt(userId);
  const tid = parseInt(tournamentId);

  await sql`DELETE FROM picks WHERE user_id = ${uid} AND tournament_id = ${tid}`;
  await sql`DELETE FROM scores WHERE user_id = ${uid} AND tournament_id = ${tid}`;

  return NextResponse.json({ ok: true });
}
