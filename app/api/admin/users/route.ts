import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get('tournament_id');

  const rows = await sql`
    SELECT
      u.id, u.username, u.email, u.role, u.created_at,
      COALESCE(p.pick_count, 0) AS pick_count,
      s.total_points,
      s.max_possible
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS pick_count
      FROM picks
      WHERE tournament_id = ${tournamentId ? parseInt(tournamentId) : null}
      GROUP BY user_id
    ) p ON p.user_id = u.id
    LEFT JOIN scores s
      ON s.user_id = u.id AND s.tournament_id = ${tournamentId ? parseInt(tournamentId) : null}
    ORDER BY u.username ASC
  `;
  return NextResponse.json(rows);
}
