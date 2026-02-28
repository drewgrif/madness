'use client';

import { GameWithTeams, Pick, Region } from '@/lib/types';
import TeamSlot from './TeamSlot';

interface BracketGameProps {
  game: GameWithTeams;
  userPicks: Map<number, Pick>;
  isLocked: boolean;
  onPick: (gameNumber: number, teamId: number) => void;
  showConnectorRight?: boolean;
  showConnectorLeft?: boolean;
}

export default function BracketGame({
  game, userPicks, isLocked, onPick,
  showConnectorRight = false,
  showConnectorLeft = false,
}: BracketGameProps) {
  const pick = userPicks.get(game.game_number);
  const pickedId = pick?.picked_team_id ?? null;

  const isEliminated = (teamId: number | null) => {
    if (!teamId) return false;
    return game.winner_id !== null && game.winner_id !== teamId;
  };

  return (
    <div
      className={`
        relative border border-slate-200 rounded overflow-hidden shadow-sm
        ${showConnectorRight ? 'bracket-connector-left' : ''}
        ${showConnectorLeft ? 'bracket-connector-right' : ''}
        min-w-[130px] w-[130px]
      `}
      style={{ backgroundColor: 'white' }}
    >
      <TeamSlot
        teamId={game.team1_id}
        teamName={game.team1_name}
        teamShort={game.team1_short}
        teamSeed={game.team1_seed}
        teamColor={game.team1_color}
        region={game.region as Region | null}
        isWinner={game.winner_id === game.team1_id && game.winner_id !== null}
        isPicked={pickedId === game.team1_id}
        isCorrect={pickedId === game.team1_id ? (pick?.is_correct ?? null) : null}
        isEliminated={isEliminated(game.team1_id)}
        isLocked={isLocked}
        onClick={() => game.team1_id && onPick(game.game_number, game.team1_id)}
      />
      <TeamSlot
        teamId={game.team2_id}
        teamName={game.team2_name}
        teamShort={game.team2_short}
        teamSeed={game.team2_seed}
        teamColor={game.team2_color}
        region={game.region as Region | null}
        isWinner={game.winner_id === game.team2_id && game.winner_id !== null}
        isPicked={pickedId === game.team2_id}
        isCorrect={pickedId === game.team2_id ? (pick?.is_correct ?? null) : null}
        isEliminated={isEliminated(game.team2_id)}
        isLocked={isLocked}
        onClick={() => game.team2_id && onPick(game.game_number, game.team2_id)}
      />
    </div>
  );
}
