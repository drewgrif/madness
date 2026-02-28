import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateBracket } from '@/lib/bracket';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id } = await params;
  try {
    const count = await generateBracket(parseInt(id));
    return NextResponse.json({ ok: true, games: count });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
