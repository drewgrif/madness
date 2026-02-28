import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/tournament — active tournament
export async function GET() {
  const rows = await sql`SELECT * FROM tournaments ORDER BY id DESC LIMIT 1`;
  return NextResponse.json(rows[0] ?? null);
}

// POST /api/tournament — create (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { name, year } = await req.json();
  if (!name || !year) return NextResponse.json({ error: 'name and year required' }, { status: 400 });

  const rows = await sql`
    INSERT INTO tournaments (name, year) VALUES (${name}, ${year})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
