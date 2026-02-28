import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);

  const rows = await sql`
    SELECT id, username, email, role, created_at FROM users WHERE id = ${session.id}
  `;
  return NextResponse.json(rows[0] ?? null);
}
