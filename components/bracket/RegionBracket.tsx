'use client';

import { GameWithTeams, Pick, Region, REGION_COLORS, ROUND_NAMES } from '@/lib/types';
import BracketGame from './BracketGame';

interface RegionBracketProps {
  region: Region;
  games: GameWithTeams[];
  userPicks: Map<number, Pick>;
  isLocked: boolean;
  onPick: (gameNumber: number, teamId: number) => void;
  side: 'left' | 'right';
}

// Game spacings — each round's games need vertical spacing that doubles each round
// to visually align with their predecessors.
// Game height = 64px (2 × 32px slots), plus 2px for borders
const GAME_H = 66;
const GAP_BETWEEN_PAIRS: Record<number, number> = {
  1: 4,   // R1: minimal gap between game pairs
  2: 70,  // R2: gap = game height so each R2 game centers between its R1 pair
  3: 204, // S16: = 3 * GAME_H + 2 * gap(R2)
  4: 476, // E8: centers between its S16 pair
};

type RoundGames = { round: number; games: GameWithTeams[] };

export default function RegionBracket({
  region, games, userPicks, isLocked, onPick, side,
}: RegionBracketProps) {
  const color = REGION_COLORS[region];

  // Separate games by round (1-4 for regions)
  const rounds: RoundGames[] = [1, 2, 3, 4].map(r => ({
    round: r,
    games: games.filter(g => g.round === r).sort((a, b) => a.game_number - b.game_number),
  }));

  // For right-side regions, reverse round order so rounds flow inward
  const displayRounds = side === 'right' ? [...rounds].reverse() : rounds;

  return (
    <div className="flex flex-col">
      {/* Region header */}
      <div
        className="text-center text-xs font-bold uppercase tracking-widest mb-3 py-1 px-3 rounded"
        style={{ color, borderBottom: `2px solid ${color}`, letterSpacing: '0.15em' }}
      >
        {region}
      </div>

      {/* Rounds */}
      <div className="flex gap-1 items-start">
        {displayRounds.map(({ round, games: roundGames }, colIdx) => {
          // Number of pairs for this round (R1=4 pairs, R2=2, S16=1, E8=N/A)
          // Gap between pairs (between groups of 2 games that feed a R+1 game)
          const gap = GAP_BETWEEN_PAIRS[round] ?? 0;
          const isLastRound = round === 4;

          return (
            <div key={round} className="flex flex-col" style={{ gap: `${gap}px` }}>
              {/* Round label */}
              <div className="text-[9px] uppercase tracking-widest text-slate-400 text-center mb-1 h-3">
                {round === 1 ? 'R64' : round === 2 ? 'R32' : round === 3 ? 'S16' : 'E8'}
              </div>

              {/* Group games into pairs for connector lines */}
              {round <= 3
                ? groupIntoPairs(roundGames).map((pair, pairIdx) => (
                    <div
                      key={pairIdx}
                      className="flex flex-col"
                      style={{ gap: '4px', position: 'relative' }}
                    >
                      {pair.map((game, gameIdx) => (
                        <div key={game.game_number} className="relative">
                          <BracketGame
                            game={game}
                            userPicks={userPicks}
                            isLocked={isLocked}
                            onPick={onPick}
                            showConnectorRight={side === 'left' && !isLastRound}
                            showConnectorLeft={side === 'right' && !isLastRound}
                          />
                          {/* Horizontal connector line to next round */}
                          {side === 'left' && !isLastRound && (
                            <div
                              className="absolute top-1/2 -right-1 w-1 border-t border-slate-200"
                              style={{ transform: 'translateY(-50%)' }}
                            />
                          )}
                          {side === 'right' && !isLastRound && (
                            <div
                              className="absolute top-1/2 -left-1 w-1 border-t border-slate-200"
                              style={{ transform: 'translateY(-50%)' }}
                            />
                          )}
                        </div>
                      ))}

                      {/* Vertical connector on the outside of the pair */}
                      {pair.length === 2 && (
                        <div
                          className="absolute pointer-events-none"
                          style={
                            side === 'left'
                              ? { right: -1, top: `${GAME_H / 2}px`, height: `${GAME_H + 4}px`, width: 1, backgroundColor: '#cbd5e1' }
                              : { left: -1, top: `${GAME_H / 2}px`, height: `${GAME_H + 4}px`, width: 1, backgroundColor: '#cbd5e1' }
                          }
                        />
                      )}
                    </div>
                  ))
                : roundGames.map(game => (
                    <div key={game.game_number} className="relative">
                      <BracketGame
                        game={game}
                        userPicks={userPicks}
                        isLocked={isLocked}
                        onPick={onPick}
                        showConnectorRight={side === 'left'}
                        showConnectorLeft={side === 'right'}
                      />
                    </div>
                  ))
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

function groupIntoPairs<T>(arr: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push(arr.slice(i, i + 2));
  }
  return pairs;
}
