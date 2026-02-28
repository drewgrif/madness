import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Tournament } from '@/lib/types';
import AdminPanel from '@/components/admin/AdminPanel';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/');

  let tournament: Tournament | null = null;
  try {
    const rows = await sql`SELECT * FROM tournaments ORDER BY id DESC LIMIT 1`;
    tournament = (rows[0] as Tournament) ?? null;
  } catch {
    // DB not initialized yet
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-base font-black tracking-tight text-slate-900">
              MARCH <span className="text-orange-500">MADNESS</span>
            </Link>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{session.username}</span>
            <Link href="/" className="text-xs px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 rounded-md transition-colors">
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AdminPanel initialTournament={tournament} />
      </main>
    </div>
  );
}
