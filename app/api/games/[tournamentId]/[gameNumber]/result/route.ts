import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { recordResult } from '@/lib/scoring';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string; gameNumber: string }> }
) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { tournamentId, gameNumber } = await params;
  const { winner_id } = await req.json();
  if (!winner_id) return NextResponse.json({ error: 'winner_id required' }, { status: 400 });

  try {
    await recordResult(parseInt(tournamentId), parseInt(gameNumber), winner_id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
