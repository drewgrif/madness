import Link from 'next/link';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Score, Tournament } from '@/lib/types';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';

export const revalidate = 60; // revalidate every minute

export default async function LeaderboardPage() {
  const session = await getSession();

  let tournament: Tournament | null = null;
  let scores: Score[] = [];

  try {
    const tRows = await sql`SELECT * FROM tournaments ORDER BY id DESC LIMIT 1`;
    tournament = (tRows[0] as Tournament) ?? null;

    if (tournament) {
      const sRows = await sql`
        SELECT s.*, u.username
        FROM scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.tournament_id = ${tournament.id}
        ORDER BY s.total_points DESC, s.max_possible DESC, u.username ASC
      `;
      scores = sRows as Score[];
    }
  } catch {
    // DB not initialized
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-base font-black tracking-tight text-slate-900">
              MARCH <span className="text-orange-500">MADNESS</span>
            </Link>
            <span className="text-xs text-slate-400">Leaderboard</span>
          </div>
          <Link href="/" className="text-xs px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 rounded-md transition-colors">
            ← Bracket
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">
            {tournament?.name ?? 'Leaderboard'}
          </h1>
          <span className="text-sm text-slate-400">{scores.length} players</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <LeaderboardTable scores={scores} currentUserId={session?.id ?? null} />
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Points: R64=1 · R32=2 · S16=4 · E8=8 · F4=16 · Champ=32 · Max=192
        </p>
      </main>
    </div>
  );
}
