import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql`
    SELECT s.*, u.username
    FROM scores s
    JOIN users u ON s.user_id = u.id
    WHERE s.tournament_id = ${parseInt(id)}
    ORDER BY s.total_points DESC, s.max_possible DESC, u.username ASC
  `;
  return NextResponse.json(rows);
}
