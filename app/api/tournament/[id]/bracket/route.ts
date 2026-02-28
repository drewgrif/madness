import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const games = await sql`
    SELECT
      g.*,
      t1.name  AS team1_name,  t1.short_name AS team1_short,
      t1.seed  AS team1_seed,  t1.color      AS team1_color,
      t2.name  AS team2_name,  t2.short_name AS team2_short,
      t2.seed  AS team2_seed,  t2.color      AS team2_color,
      tw.name  AS winner_name, tw.short_name AS winner_short
    FROM games g
    LEFT JOIN teams t1 ON g.team1_id = t1.id
    LEFT JOIN teams t2 ON g.team2_id = t2.id
    LEFT JOIN teams tw ON g.winner_id = tw.id
    WHERE g.tournament_id = ${parseInt(id)}
    ORDER BY g.game_number
  `;
  return NextResponse.json(games);
}
