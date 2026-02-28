import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const hash = await bcrypt.hash(password as string, 10);
    const rows = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email.toLowerCase()}, ${hash})
      RETURNING id, username, email, role, created_at
    `;
    const user = rows[0];
    const token = await signToken({ id: user.id, username: user.username, role: user.role });

    const res = NextResponse.json({ user });
    res.cookies.set({ ...cookieOptions(60 * 60 * 24 * 7), value: token });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
