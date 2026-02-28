'use client';

import { useState, useEffect } from 'react';
import { Tournament, Team, GameWithTeams, Region, REGION_COLORS } from '@/lib/types';

interface AdminPanelProps {
  initialTournament: Tournament | null;
}

type Tab = 'tournament' | 'teams' | 'bracket' | 'results' | 'users';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  pick_count: number;
  total_points: number | null;
  max_possible: number | null;
}

export default function AdminPanel({ initialTournament }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('tournament');
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const flash = (m: string, isErr = false) => {
    isErr ? setErr(m) : setMsg(m);
    setTimeout(() => isErr ? setErr('') : setMsg(''), 3000);
  };

  const loadTeams = async (tid: number) => {
    const r = await fetch(`/api/tournament/${tid}/bracket`);
    const gamesData = await r.json();
    setGames(gamesData);

    // Also get teams
    const tr = await fetch(`/api/tournament/${tid}/bracket`);
  };

  const loadGames = async (tid: number) => {
    const r = await fetch(`/api/tournament/${tid}/bracket`);
    setGames(await r.json());
  };

  const loadUsers = async (tid: number) => {
    const r = await fetch(`/api/admin/users?tournament_id=${tid}`);
    if (r.ok) setUsers(await r.json());
  };

  useEffect(() => {
    if (tournament) {
      loadGames(tournament.id);
      loadTeamsData(tournament.id);
      loadUsers(tournament.id);
    }
  }, [tournament?.id]);

  const loadTeamsData = async (tid: number) => {
    // extract teams from games or fetch directly
    const r = await fetch(`/api/tournament/${tid}/bracket`);
    const gamesData: GameWithTeams[] = await r.json();
    setGames(gamesData);
    // Rebuild unique teams from game data
    const teamMap = new Map<number, Team>();
    for (const g of gamesData) {
      if (g.team1_id) teamMap.set(g.team1_id, { id: g.team1_id, tournament_id: tid, name: g.team1_name || '', short_name: g.team1_short || '', seed: g.team1_seed || 0, region: g.region as Region, color: g.team1_color || '' });
      if (g.team2_id) teamMap.set(g.team2_id, { id: g.team2_id, tournament_id: tid, name: g.team2_name || '', short_name: g.team2_short || '', seed: g.team2_seed || 0, region: g.region as Region, color: g.team2_color || '' });
    }
    setTeams(Array.from(teamMap.values()).sort((a, b) => a.region.localeCompare(b.region) || a.seed - b.seed));
  };

  // ── Tournament setup ──────────────────────────────────────────────
  const createTournament = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fd.get('name'), year: parseInt(fd.get('year') as string) }),
    });
    const data = await r.json();
    if (r.ok) { setTournament(data); flash('Tournament created!'); }
    else flash(data.error, true);
  };

  const updateStatus = async (status: string, picks_locked?: boolean) => {
    if (!tournament) return;
    const r = await fetch(`/api/tournament/${tournament.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(picks_locked !== undefined ? { picks_locked } : {}) }),
    });
    const data = await r.json();
    if (r.ok) { setTournament(data); flash('Updated!'); }
    else flash(data.error, true);
  };

  const toggleLock = async () => {
    if (!tournament) return;
    const r = await fetch(`/api/tournament/${tournament.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picks_locked: !tournament.picks_locked }),
    });
    const data = await r.json();
    if (r.ok) { setTournament(data); flash(data.picks_locked ? 'Picks locked!' : 'Picks unlocked!'); }
    else flash(data.error, true);
  };

  // ── Teams ────────────────────────────────────────────────────────
  const loadPreset = async () => {
    if (!tournament) return;
    if (!confirm('Load 2024 tournament teams? This will overwrite existing teams.')) return;
    const r = await fetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_id: tournament.id }),
    });
    const data = await r.json();
    if (r.ok) { flash(`Loaded ${data.teams} teams`); loadTeamsData(tournament.id); }
    else flash(data.error, true);
  };

  const generateBracket = async () => {
    if (!tournament) return;
    const r = await fetch(`/api/tournament/${tournament.id}/generate`, { method: 'POST' });
    const data = await r.json();
    if (r.ok) { flash(`Generated ${data.games} games!`); loadGames(tournament.id); }
    else flash(data.error, true);
  };

  // ── Results ──────────────────────────────────────────────────────
  const setWinner = async (gameNumber: number, winnerId: number) => {
    if (!tournament) return;
    const r = await fetch(`/api/games/${tournament.id}/${gameNumber}/result`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_id: winnerId }),
    });
    const data = await r.json();
    if (r.ok) { flash('Result saved!'); loadGames(tournament.id); }
    else flash(data.error, true);
  };

  const clearWinner = async (gameNumber: number) => {
    if (!tournament) return;
    const r = await fetch(`/api/games/${tournament.id}/${gameNumber}/result`, { method: 'DELETE' });
    const data = await r.json();
    if (r.ok) { flash('Result cleared.'); loadGames(tournament.id); }
    else flash(data.error, true);
  };

  const deleteBracket = async (userId: number, username: string) => {
    if (!tournament) return;
    if (!confirm(`Delete all picks for ${username}? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/users/${userId}/picks?tournament_id=${tournament.id}`, { method: 'DELETE' });
    const data = await r.json();
    if (r.ok) { flash(`Bracket deleted for ${username}.`); loadUsers(tournament.id); }
    else flash(data.error, true);
  };

  const roundGames = (round: number) =>
    games.filter(g => g.round === round).sort((a, b) => a.game_number - b.game_number);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'tournament', label: 'Setup' },
    { id: 'teams', label: `Teams (${teams.length}/64)` },
    { id: 'bracket', label: 'Bracket' },
    { id: 'results', label: 'Results' },
    { id: 'users', label: `Users (${users.length})` },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Messages */}
      {msg && <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">{msg}</div>}
      {err && <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{err}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SETUP TAB ── */}
      {tab === 'tournament' && (
        <div className="space-y-6">
          {!tournament ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Create Tournament</h2>
              <form onSubmit={createTournament} className="flex gap-3 flex-wrap">
                <input name="name" placeholder="e.g. March Madness 2026" required
                  className="flex-1 min-w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input name="year" type="number" placeholder="2026" defaultValue={new Date().getFullYear()} required
                  className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <button type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
                  Create
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">{tournament.name}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{tournament.year} · ID: {tournament.id}</p>
                </div>
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  tournament.status === 'complete' ? 'bg-slate-100 text-slate-500' :
                  tournament.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                  tournament.status === 'open' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{tournament.status}</span>
              </div>

              {/* Status controls */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 self-center mr-1">Status:</span>
                {(['setup', 'open', 'in_progress', 'complete'] as const).map(s => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                      tournament.status === s
                        ? 'border-orange-400 text-orange-600 bg-orange-50'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Picks:</span>
                <button
                  onClick={toggleLock}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    tournament.picks_locked
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {tournament.picks_locked ? '🔒 Locked — click to unlock' : '🔓 Open — click to lock'}
                </button>
              </div>
            </div>
          )}

          {/* DB Init helper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First time setup</h3>
            <p className="text-xs text-slate-400 mb-3">Initialize the database tables on first deploy.</p>
            <button
              onClick={async () => {
                const r = await fetch('/api/admin/init', { method: 'POST' });
                const d = await r.json();
                flash(d.message || d.error || 'Done', !r.ok);
              }}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
            >
              Initialize Database
            </button>
          </div>
        </div>
      )}

      {/* ── TEAMS TAB ── */}
      {tab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{teams.length} of 64 teams loaded</p>
            <div className="flex gap-2">
              {tournament && (
                <>
                  <button onClick={loadPreset}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Load 2024 Teams
                  </button>
                  <button onClick={generateBracket} disabled={teams.length !== 64}
                    className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40">
                    Generate Bracket →
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Teams by region */}
          {(['East', 'West', 'South', 'Midwest'] as Region[]).map(region => {
            const regionTeams = teams.filter(t => t.region === region).sort((a, b) => a.seed - b.seed);
            return (
              <div key={region} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REGION_COLORS[region] }} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{region}</span>
                  <span className="text-xs text-slate-400 ml-auto">{regionTeams.length}/16</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {regionTeams.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2">
                      <span className="text-xs font-mono text-slate-400 w-4">{t.seed}</span>
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-sm text-slate-700 flex-1">{t.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{t.short_name}</span>
                    </div>
                  ))}
                  {regionTeams.length === 0 && (
                    <div className="px-4 py-6 text-sm text-slate-300 text-center italic">No teams yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BRACKET TAB ── */}
      {tab === 'bracket' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{games.length} games generated</p>
            {tournament && (
              <button onClick={generateBracket}
                className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                Regenerate Bracket
              </button>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">#</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Round</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Region</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Team 1</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Team 2</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {games.map(g => (
                  <tr key={g.game_number} className="hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-mono text-slate-400">{g.game_number}</td>
                    <td className="px-3 py-1.5 text-slate-500">{['','R64','R32','S16','E8','F4','Champ'][g.round]}</td>
                    <td className="px-3 py-1.5">
                      {g.region && (
                        <span className="font-medium" style={{ color: REGION_COLORS[g.region as Region] }}>{g.region}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{g.team1_short || '—'}</td>
                    <td className="px-3 py-1.5 text-slate-700">{g.team2_short || '—'}</td>
                    <td className="px-3 py-1.5 text-green-600 font-medium">{g.winner_short || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{users.length} registered users</p>
            {tournament && (
              <button
                onClick={() => loadUsers(tournament.id)}
                className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 hover:border-slate-400 rounded-lg transition-colors"
              >
                Refresh
              </button>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Username</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Email</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Picks</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Score</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Max</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {u.username}
                      {u.role === 'admin' && (
                        <span className="ml-2 text-xs text-orange-500 font-normal">admin</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{u.pick_count}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                      {u.total_points ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500">
                      {u.max_possible ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {u.pick_count > 0 && (
                        <button
                          onClick={() => deleteBracket(u.id, u.username)}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                        >
                          Delete bracket
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-300 italic">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RESULTS TAB ── */}
      {tab === 'results' && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">Click a team name to record them as the winner. Scores update automatically.</p>
          {[1, 2, 3, 4, 5, 6].map(round => {
            const rGames = roundGames(round);
            if (!rGames.length) return null;
            const roundLabel = ['', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'Championship'][round];
            return (
              <div key={round} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{roundLabel}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {rGames.map(g => (
                    <div key={g.game_number} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-xs text-slate-400 font-mono w-6">{g.game_number}</span>
                      {g.region && (
                        <span className="text-xs font-medium w-14" style={{ color: REGION_COLORS[g.region as Region] }}>{g.region}</span>
                      )}
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => g.team1_id && setWinner(g.game_number, g.team1_id)}
                          disabled={!g.team1_id}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            g.winner_id === g.team1_id
                              ? 'bg-green-100 border-green-300 text-green-700 font-bold'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400 disabled:opacity-30'
                          }`}
                        >
                          {g.team1_short || 'TBD'}
                        </button>
                        <span className="text-slate-300 text-xs">vs</span>
                        <button
                          onClick={() => g.team2_id && setWinner(g.game_number, g.team2_id)}
                          disabled={!g.team2_id}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            g.winner_id === g.team2_id
                              ? 'bg-green-100 border-green-300 text-green-700 font-bold'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400 disabled:opacity-30'
                          }`}
                        >
                          {g.team2_short || 'TBD'}
                        </button>
                      </div>
                      {g.winner_id && (
                        <button
                          onClick={() => clearWinner(g.game_number)}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1"
                          title="Clear result"
                        >
                          ✓ clear
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
