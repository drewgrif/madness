import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDb, sql } from '@/lib/db';

// Called once on first deploy to initialize DB and create admin user
export async function POST() {
  try {
    await initDb();

    const existing = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already initialized' });
    }

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'changeme';
    const hash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (username, email, password, role)
      VALUES (${username}, ${username + '@madness.local'}, ${hash}, 'admin')
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ ok: true, message: `Admin created: ${username}` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
