import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json();

  // Bulk insert
  if (Array.isArray(body.teams)) {
    for (const t of body.teams) {
      await sql`
        INSERT INTO teams (tournament_id, name, short_name, seed, region, color)
        VALUES (${t.tournament_id}, ${t.name}, ${t.short_name}, ${t.seed}, ${t.region}, ${t.color || '#333333'})
        ON CONFLICT (tournament_id, seed, region) DO UPDATE SET
          name = EXCLUDED.name, short_name = EXCLUDED.short_name, color = EXCLUDED.color
      `;
    }
    return NextResponse.json({ inserted: body.teams.length });
  }

  // Single insert
  const { tournament_id, name, short_name, seed, region, color } = body;
  if (!tournament_id || !name || !short_name || !seed || !region) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO teams (tournament_id, name, short_name, seed, region, color)
    VALUES (${tournament_id}, ${name}, ${short_name}, ${seed}, ${region}, ${color || '#333333'})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
