import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  const rows = await sql`
    SELECT * FROM users WHERE username = ${username} OR email = ${username.toLowerCase()}
  `;
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signToken({ id: user.id, username: user.username, role: user.role });
  const { password: _, ...safeUser } = user;

  const res = NextResponse.json({ user: safeUser });
  res.cookies.set({ ...cookieOptions(60 * 60 * 24 * 7), value: token });
  return res;
}
