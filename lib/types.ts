export type Region = 'East' | 'West' | 'South' | 'Midwest';
export type Round = 1 | 2 | 3 | 4 | 5 | 6;
export type TournamentStatus = 'setup' | 'open' | 'in_progress' | 'complete';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Tournament {
  id: number;
  name: string;
  year: number;
  status: TournamentStatus;
  picks_locked: boolean;
  created_at: string;
}

export interface Team {
  id: number;
  tournament_id: number;
  name: string;
  short_name: string;
  seed: number;
  region: Region;
  color: string;
}

export interface Game {
  id: number;
  tournament_id: number;
  game_number: number;
  round: Round;
  region: Region | null;
  team1_id: number | null;
  team2_id: number | null;
  winner_id: number | null;
  next_game: number | null;
  next_slot: 1 | 2 | null;
}

export interface GameWithTeams extends Game {
  team1_name: string | null;
  team1_short: string | null;
  team1_seed: number | null;
  team1_color: string | null;
  team2_name: string | null;
  team2_short: string | null;
  team2_seed: number | null;
  team2_color: string | null;
  winner_name: string | null;
  winner_short: string | null;
}

export interface Pick {
  user_id: number;
  tournament_id: number;
  game_number: number;
  picked_team_id: number;
  is_correct: boolean | null;
  team_name?: string;
  short_name?: string;
  seed?: number;
  region?: Region;
  color?: string;
}

export interface Score {
  user_id: number;
  tournament_id: number;
  username: string;
  total_points: number;
  r64_pts: number;
  r32_pts: number;
  s16_pts: number;
  e8_pts: number;
  f4_pts: number;
  champ_pts: number;
  max_possible: number;
}

export interface BracketState {
  tournament: Tournament;
  games: GameWithTeams[];
  teams: Team[];
}

// Points per round
export const ROUND_POINTS: Record<Round, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
  6: 32,
};

export const ROUND_NAMES: Record<Round, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite Eight',
  5: 'Final Four',
  6: 'Championship',
};

export const REGION_COLORS: Record<Region, string> = {
  East: '#3b82f6',
  West: '#ef4444',
  South: '#22c55e',
  Midwest: '#a855f7',
};
