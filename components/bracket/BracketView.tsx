'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameWithTeams, Pick, Region, Tournament } from '@/lib/types';
import RegionBracket from './RegionBracket';
import BracketGame from './BracketGame';

interface BracketViewProps {
  tournament: Tournament;
  games: GameWithTeams[];
  initialPicks: Pick[];
  isLocked: boolean;
  userId: number | null;
}

export default function BracketView({
  tournament, games, initialPicks, isLocked, userId,
}: BracketViewProps) {
  const [picks, setPicks] = useState<Map<number, Pick>>(() => {
    const m = new Map<number, Pick>();
    for (const p of initialPicks) m.set(p.game_number, p);
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh picks when initialPicks change (e.g., after login)
  useEffect(() => {
    const m = new Map<number, Pick>();
    for (const p of initialPicks) m.set(p.game_number, p);
    setPicks(m);
  }, [initialPicks]);

  // Propagate picks through the bracket visually (round by round)
  const resolvedGames = useMemo(() => {
    const resolved = new Map<number, GameWithTeams>();
    for (const g of games) resolved.set(g.game_number, { ...g });

    // Process in round order so earlier picks feed later rounds
    const sorted = [...games].sort((a, b) => a.round - b.round || a.game_number - b.game_number);

    for (const game of sorted) {
      const pick = picks.get(game.game_number);
      if (!pick || !game.next_game || game.next_slot == null) continue;

      const current = resolved.get(game.game_number)!;
      const next = resolved.get(game.next_game);
      if (!next) continue;

      // Determine picked team's data from the resolved current game
      let id: number | null = null;
      let name: string | null = null;
      let short: string | null = null;
      let seed: number | null = null;
      let color: string | null = null;

      if (pick.picked_team_id === current.team1_id) {
        id = current.team1_id; name = current.team1_name; short = current.team1_short;
        seed = current.team1_seed; color = current.team1_color;
      } else if (pick.picked_team_id === current.team2_id) {
        id = current.team2_id; name = current.team2_name; short = current.team2_short;
        seed = current.team2_seed; color = current.team2_color;
      }

      if (id === null) continue;

      // Only fill null slots — don't override admin-propagated results
      if (game.next_slot === 1 && !next.team1_id) {
        resolved.set(game.next_game, { ...next, team1_id: id, team1_name: name, team1_short: short, team1_seed: seed, team1_color: color });
      } else if (game.next_slot === 2 && !next.team2_id) {
        resolved.set(game.next_game, { ...next, team2_id: id, team2_name: name, team2_short: short, team2_seed: seed, team2_color: color });
      }
    }

    return Array.from(resolved.values());
  }, [games, picks]);

  // Resolved games indexed by number — used for pick validation in later rounds
  const resolvedByNumber = useMemo(() => {
    const m = new Map<number, GameWithTeams>();
    for (const g of resolvedGames) m.set(g.game_number, g);
    return m;
  }, [resolvedGames]);

  const handlePick = useCallback((gameNumber: number, teamId: number) => {
    if (isLocked || !userId) return;

    const game = resolvedByNumber.get(gameNumber);
    if (!game) return;
    if (teamId !== game.team1_id && teamId !== game.team2_id) return;

    setPicks(prev => {
      const next = new Map(prev);
      const existing = next.get(gameNumber);
      next.set(gameNumber, {
        user_id: userId,
        tournament_id: tournament.id,
        game_number: gameNumber,
        picked_team_id: teamId,
        is_correct: existing?.picked_team_id === teamId ? existing.is_correct : null,
      });
      return next;
    });

    // Debounced save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => savePicks(), 800);
    setSaved(false);
  }, [isLocked, userId, resolvedByNumber, tournament.id]);

  const savePicks = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = Array.from(picks.values()).map(p => ({
        game_number: p.game_number,
        picked_team_id: p.picked_team_id,
      }));
      const res = await fetch(`/api/picks/${tournament.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: payload }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Save failed');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const regionGames = (region: Region) =>
    resolvedGames.filter(g => g.region === region);

  const f4Games = resolvedGames.filter(g => g.round === 5).sort((a, b) => a.game_number - b.game_number);
  const champGame = resolvedGames.find(g => g.round === 6);

  const completedPicks = picks.size;
  const totalGames = games.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Status bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{completedPicks} / {totalGames} picks</span>
          <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-300"
              style={{ width: `${(completedPicks / totalGames) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {saving && <span className="text-xs text-slate-400 animate-pulse">Saving…</span>}
          {saved && <span className="text-xs text-green-500">Saved ✓</span>}
          {!isLocked && userId && (
            <button
              onClick={savePicks}
              disabled={saving}
              className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors disabled:opacity-50"
            >
              Save Bracket
            </button>
          )}
          {isLocked && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
              🔒 Picks locked
            </span>
          )}
          {!userId && (
            <span className="text-xs text-slate-400 italic">Sign in to save picks</span>
          )}
        </div>
      </div>

      {/* Bracket canvas */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 items-start min-w-max px-2">

          {/* LEFT HALF: East (top) + West (bottom) */}
          <div className="flex flex-col gap-8">
            <RegionBracket
              region="East"
              games={regionGames('East')}
              userPicks={picks}
              isLocked={isLocked}
              onPick={handlePick}
              side="left"
            />
            <RegionBracket
              region="West"
              games={regionGames('West')}
              userPicks={picks}
              isLocked={isLocked}
              onPick={handlePick}
              side="left"
            />
          </div>

          {/* CENTER: Final Four + Championship */}
          <div className="flex flex-col items-center justify-center gap-4 self-center px-4">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 text-center">Final Four</div>

            {f4Games[0] && (
              <div className="flex flex-col items-center">
                <div className="text-[9px] text-slate-400 mb-1 text-center">East / South</div>
                <BracketGame
                  game={f4Games[0]}
                  userPicks={picks}
                  isLocked={isLocked}
                  onPick={handlePick}
                />
              </div>
            )}

            {champGame && (
              <div className="flex flex-col items-center my-2">
                <div
                  className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1 text-center"
                >
                  Championship
                </div>
                <BracketGame
                  game={champGame}
                  userPicks={picks}
                  isLocked={isLocked}
                  onPick={handlePick}
                />
                {champGame.winner_id && (
                  <div className="mt-2 text-xs font-bold text-green-600 text-center">
                    🏆 {champGame.winner_name}
                  </div>
                )}
              </div>
            )}

            {f4Games[1] && (
              <div className="flex flex-col items-center">
                <div className="text-[9px] text-slate-400 mb-1 text-center">West / Midwest</div>
                <BracketGame
                  game={f4Games[1]}
                  userPicks={picks}
                  isLocked={isLocked}
                  onPick={handlePick}
                />
              </div>
            )}
          </div>

          {/* RIGHT HALF: South (top) + Midwest (bottom) */}
          <div className="flex flex-col gap-8">
            <RegionBracket
              region="South"
              games={regionGames('South')}
              userPicks={picks}
              isLocked={isLocked}
              onPick={handlePick}
              side="right"
            />
            <RegionBracket
              region="Midwest"
              games={regionGames('Midwest')}
              userPicks={picks}
              isLocked={isLocked}
              onPick={handlePick}
              side="right"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
