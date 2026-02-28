import { sql } from './db';
import { Region, Round, Team } from './types';

// Standard NCAA seed matchups per region in Round 1
const R1_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13],
  [6, 11], [3, 14], [7, 10], [2, 15],
];

const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest'];

// Game number layout (63 total games)
// R64: East 1-8, West 9-16, South 17-24, Midwest 25-32
// R32: East 33-36, West 37-40, South 41-44, Midwest 45-48
// S16: East 49-50, West 51-52, South 53-54, Midwest 55-56
// E8:  East 57, West 58, South 59, Midwest 60
// F4:  61, 62  |  Championship: 63

const REGION_R64_START: Record<Region, number> = { East: 1, West: 9, South: 17, Midwest: 25 };
const REGION_R32_START: Record<Region, number> = { East: 33, West: 37, South: 41, Midwest: 45 };
const REGION_S16_START: Record<Region, number> = { East: 49, West: 51, South: 53, Midwest: 55 };
const REGION_E8: Record<Region, number> = { East: 57, West: 58, South: 59, Midwest: 60 };

// F4 connections: East+South → game 61, West+Midwest → game 62
const E8_TO_F4: Record<Region, { next_game: number; next_slot: 1 | 2 }> = {
  East:    { next_game: 61, next_slot: 1 },
  South:   { next_game: 61, next_slot: 2 },
  West:    { next_game: 62, next_slot: 1 },
  Midwest: { next_game: 62, next_slot: 2 },
};

interface GameInsert {
  tournament_id: number;
  game_number: number;
  round: Round;
  region: Region | null;
  team1_id: number | null;
  team2_id: number | null;
  next_game: number | null;
  next_slot: 1 | 2 | null;
}

export async function generateBracket(tournamentId: number) {
  const teams = (await sql`
    SELECT * FROM teams WHERE tournament_id = ${tournamentId}
  `) as Team[];

  if (teams.length !== 64) {
    throw new Error(`Need exactly 64 teams, found ${teams.length}`);
  }

  const byRegionSeed: Record<string, Team> = {};
  for (const t of teams) {
    byRegionSeed[`${t.region}_${t.seed}`] = t;
  }

  const games: GameInsert[] = [];

  for (const region of REGIONS) {
    const r64 = REGION_R64_START[region];
    const r32 = REGION_R32_START[region];
    const s16 = REGION_S16_START[region];
    const e8  = REGION_E8[region];

    // Round 1 — 8 games
    for (let i = 0; i < 8; i++) {
      const [s1, s2] = R1_MATCHUPS[i];
      games.push({
        tournament_id: tournamentId,
        game_number: r64 + i,
        round: 1,
        region,
        team1_id: byRegionSeed[`${region}_${s1}`]?.id ?? null,
        team2_id: byRegionSeed[`${region}_${s2}`]?.id ?? null,
        next_game: r32 + Math.floor(i / 2),
        next_slot: ((i % 2) + 1) as 1 | 2,
      });
    }

    // Round 2 — 4 games
    for (let i = 0; i < 4; i++) {
      games.push({
        tournament_id: tournamentId,
        game_number: r32 + i,
        round: 2,
        region,
        team1_id: null,
        team2_id: null,
        next_game: s16 + Math.floor(i / 2),
        next_slot: ((i % 2) + 1) as 1 | 2,
      });
    }

    // Sweet 16 — 2 games
    for (let i = 0; i < 2; i++) {
      games.push({
        tournament_id: tournamentId,
        game_number: s16 + i,
        round: 3,
        region,
        team1_id: null,
        team2_id: null,
        next_game: e8,
        next_slot: (i + 1) as 1 | 2,
      });
    }

    // Elite 8 — 1 game
    const { next_game, next_slot } = E8_TO_F4[region];
    games.push({
      tournament_id: tournamentId,
      game_number: e8,
      round: 4,
      region,
      team1_id: null,
      team2_id: null,
      next_game,
      next_slot,
    });
  }

  // Final Four
  games.push({
    tournament_id: tournamentId,
    game_number: 61,
    round: 5,
    region: null,
    team1_id: null,
    team2_id: null,
    next_game: 63,
    next_slot: 1,
  });
  games.push({
    tournament_id: tournamentId,
    game_number: 62,
    round: 5,
    region: null,
    team1_id: null,
    team2_id: null,
    next_game: 63,
    next_slot: 2,
  });

  // Championship
  games.push({
    tournament_id: tournamentId,
    game_number: 63,
    round: 6,
    region: null,
    team1_id: null,
    team2_id: null,
    next_game: null,
    next_slot: null,
  });

  // Delete existing and insert all games
  await sql`DELETE FROM games WHERE tournament_id = ${tournamentId}`;

  for (const g of games) {
    await sql`
      INSERT INTO games (tournament_id, game_number, round, region, team1_id, team2_id, next_game, next_slot)
      VALUES (${g.tournament_id}, ${g.game_number}, ${g.round}, ${g.region},
              ${g.team1_id}, ${g.team2_id}, ${g.next_game}, ${g.next_slot})
    `;
  }

  return games.length;
}
