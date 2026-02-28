import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { TEAMS_2024 } from '@/lib/teams-preset';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { tournament_id } = await req.json();
  if (!tournament_id) return NextResponse.json({ error: 'tournament_id required' }, { status: 400 });

  for (const t of TEAMS_2024) {
    await sql`
      INSERT INTO teams (tournament_id, name, short_name, seed, region, color)
      VALUES (${tournament_id}, ${t.name}, ${t.short_name}, ${t.seed}, ${t.region}, ${t.color})
      ON CONFLICT (tournament_id, seed, region) DO UPDATE SET
        name = EXCLUDED.name, short_name = EXCLUDED.short_name, color = EXCLUDED.color
    `;
  }

  return NextResponse.json({ ok: true, teams: TEAMS_2024.length });
}
