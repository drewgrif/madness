'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Tournament, GameWithTeams, Pick, Score, User } from '@/lib/types';
import BracketView from '@/components/bracket/BracketView';
import AuthModal from '@/components/ui/AuthModal';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';

type View = 'bracket' | 'leaderboard';

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [showAuth, setShowAuth] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [view, setView] = useState<View>('bracket');
  const [loading, setLoading] = useState(true);

  // Load session
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => setUser(data)).catch(() => setUser(null));
  }, []);

  // Load tournament and bracket
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const tRes = await fetch('/api/tournament');
        const t: Tournament | null = await tRes.json();
        setTournament(t);

        if (t) {
          const [gRes, sRes] = await Promise.all([
            fetch(`/api/tournament/${t.id}/bracket`),
            fetch(`/api/tournament/${t.id}/leaderboard`),
          ]);
          setGames(await gRes.json());
          setScores(await sRes.json());
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load user picks when user changes
  useEffect(() => {
    if (user && tournament) {
      fetch(`/api/picks/${tournament.id}`)
        .then(r => r.json())
        .then(setPicks)
        .catch(() => setPicks([]));
    } else {
      setPicks([]);
    }
  }, [user?.id, tournament?.id]);

  const handleAuthSuccess = useCallback((u: User) => {
    setUser(u as User);
    setShowAuth(false);
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setPicks([]);
  };

  const isLocked = tournament?.picks_locked ?? true;
  const userScore = scores.find(s => s.user_id === user?.id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Auth modal */}
      {showAuth && <AuthModal onSuccess={handleAuthSuccess as (u: { id: number; username: string; role: string }) => void} />}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-base font-black tracking-tight text-slate-900">
              MARCH <span className="text-orange-500">MADNESS</span>
            </span>
            {tournament && (
              <span className="text-xs text-slate-400 hidden sm:inline">{tournament.name}</span>
            )}
          </div>

          {/* Nav */}
          <div className="flex items-center gap-1">
            {(['bracket', 'leaderboard'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  view === v
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3 shrink-0">
            {user === undefined ? (
              <div className="w-20 h-7 bg-slate-100 rounded animate-pulse" />
            ) : user ? (
              <>
                {userScore && (
                  <span className="text-sm text-slate-500 hidden sm:inline">
                    <span className="font-bold text-slate-800">{userScore.total_points}</span>
                    <span className="text-slate-400 text-xs ml-1">pts</span>
                  </span>
                )}
                <span className="text-sm text-slate-700 font-medium hidden sm:inline">{user.username}</span>
                {user.role === 'admin' && (
                  <Link href="/admin"
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors">
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-md transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">
            Loading bracket…
          </div>
        ) : !tournament ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <div className="text-4xl">🏀</div>
            <h2 className="text-lg font-semibold text-slate-700">No tournament yet</h2>
            <p className="text-sm text-slate-400">
              {user?.role === 'admin'
                ? <>Head to <Link href="/admin" className="text-orange-500 hover:underline">Admin</Link> to set one up.</>
                : 'Check back soon — the pool isn\'t open yet.'}
            </p>
          </div>
        ) : !games.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <div className="text-4xl">⏳</div>
            <h2 className="text-lg font-semibold text-slate-700">Bracket not yet generated</h2>
            <p className="text-sm text-slate-400">The admin needs to add teams and generate the bracket.</p>
          </div>
        ) : view === 'bracket' ? (
          <>
            {/* Banner if not signed in */}
            {!user && !showAuth && (
              <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-sm text-orange-700">
                  <strong>Sign in</strong> to save your picks and appear on the leaderboard.
                </span>
                <button
                  onClick={() => setShowAuth(true)}
                  className="shrink-0 text-sm px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}

            {/* Bracket */}
            <BracketView
              tournament={tournament}
              games={games}
              initialPicks={picks}
              isLocked={isLocked}
              userId={user?.id ?? null}
            />

            {/* Scoring legend */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
              <span>Points: R64=1 · R32=2 · S16=4 · E8=8 · F4=16 · Champ=32</span>
              <span>Total possible: 192</span>
            </div>
          </>
        ) : (
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Leaderboard</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <LeaderboardTable scores={scores} currentUserId={user?.id} />
            </div>
            {!tournament.picks_locked && (
              <p className="mt-3 text-xs text-slate-400 text-center">
                Leaderboard is visible to everyone. Picks are hidden until the bracket locks.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
