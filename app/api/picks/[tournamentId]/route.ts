import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ tournamentId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { tournamentId } = await params;
  const picks = await sql`
    SELECT p.*, t.name AS team_name, t.short_name, t.seed, t.region, t.color
    FROM picks p
    JOIN teams t ON p.picked_team_id = t.id
    WHERE p.user_id = ${session.id} AND p.tournament_id = ${parseInt(tournamentId)}
  `;
  return NextResponse.json(picks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tournamentId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { tournamentId } = await params;
  const tid = parseInt(tournamentId);

  const tourney = await sql`SELECT * FROM tournaments WHERE id = ${tid}`;
  if (!tourney[0]) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  if (tourney[0].picks_locked && session.role !== 'admin') {
    return NextResponse.json({ error: 'Picks are locked' }, { status: 403 });
  }

  const { picks } = await req.json() as { picks: { game_number: number; picked_team_id: number }[] };
  if (!Array.isArray(picks)) return NextResponse.json({ error: 'picks array required' }, { status: 400 });

  for (const p of picks) {
    await sql`
      INSERT INTO picks (user_id, tournament_id, game_number, picked_team_id)
      VALUES (${session.id}, ${tid}, ${p.game_number}, ${p.picked_team_id})
      ON CONFLICT (user_id, tournament_id, game_number) DO UPDATE SET
        picked_team_id = EXCLUDED.picked_team_id,
        is_correct = NULL
    `;
  }

  return NextResponse.json({ saved: picks.length });
}
