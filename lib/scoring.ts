import { sql } from './db';
import { ROUND_POINTS, Round } from './types';

interface GameRow { team1_id: number; team2_id: number; next_game: number | null; next_slot: number | null; }
interface UserRow { user_id: number; }
interface GameRoundRow { game_number: number; round: number; }
interface PickRow { game_number: number; is_correct: boolean | null; picked_team_id: number; }
interface DecidedRow { game_number: number; }

export async function recordResult(tournamentId: number, gameNumber: number, winnerId: number) {
  const games = await sql`
    SELECT * FROM games WHERE tournament_id = ${tournamentId} AND game_number = ${gameNumber}
  `;
  const game = games[0] as GameRow | undefined;
  if (!game) throw new Error('Game not found');
  if (winnerId !== game.team1_id && winnerId !== game.team2_id) {
    throw new Error('Winner is not a participant in this game');
  }

  await sql`UPDATE games SET winner_id = ${winnerId}
    WHERE tournament_id = ${tournamentId} AND game_number = ${gameNumber}`;

  if (game.next_game) {
    if (game.next_slot === 1) {
      await sql`UPDATE games SET team1_id = ${winnerId}
        WHERE tournament_id = ${tournamentId} AND game_number = ${game.next_game}`;
    } else {
      await sql`UPDATE games SET team2_id = ${winnerId}
        WHERE tournament_id = ${tournamentId} AND game_number = ${game.next_game}`;
    }
  }

  await sql`UPDATE picks SET is_correct = (picked_team_id = ${winnerId})
    WHERE tournament_id = ${tournamentId} AND game_number = ${gameNumber}`;

  await recalculateScores(tournamentId);
}

export async function recalculateScores(tournamentId: number) {
  const users = (await sql`
    SELECT DISTINCT user_id FROM picks WHERE tournament_id = ${tournamentId}
  `) as UserRow[];

  const allGames = (await sql`
    SELECT game_number, round FROM games WHERE tournament_id = ${tournamentId}
  `) as GameRoundRow[];
  const gameRound: Record<number, Round> = {};
  for (const g of allGames) gameRound[g.game_number] = g.round as Round;

  const decidedRows = (await sql`
    SELECT game_number FROM games
    WHERE tournament_id = ${tournamentId} AND winner_id IS NOT NULL
  `) as DecidedRow[];
  const decided = new Set(decidedRows.map(r => r.game_number));

  for (const { user_id } of users) {
    const picks = (await sql`
      SELECT game_number, is_correct, picked_team_id
      FROM picks WHERE user_id = ${user_id} AND tournament_id = ${tournamentId}
    `) as PickRow[];

    let total = 0, r64 = 0, r32 = 0, s16 = 0, e8 = 0, f4 = 0, champ = 0, maxPossible = 0;

    for (const pick of picks) {
      const round = gameRound[pick.game_number];
      const pts = ROUND_POINTS[round] ?? 0;

      if (pick.is_correct === true) {
        total += pts;
        if (round === 1) r64 += pts;
        else if (round === 2) r32 += pts;
        else if (round === 3) s16 += pts;
        else if (round === 4) e8 += pts;
        else if (round === 5) f4 += pts;
        else if (round === 6) champ += pts;
      }

      if (!decided.has(pick.game_number) && pick.is_correct !== false) {
        maxPossible += pts;
      } else if (pick.is_correct === true) {
        maxPossible += pts;
      }
    }

    await sql`
      INSERT INTO scores (user_id, tournament_id, total_points, r64_pts, r32_pts, s16_pts, e8_pts, f4_pts, champ_pts, max_possible, updated_at)
      VALUES (${user_id}, ${tournamentId}, ${total}, ${r64}, ${r32}, ${s16}, ${e8}, ${f4}, ${champ}, ${maxPossible}, NOW())
      ON CONFLICT (user_id, tournament_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        r64_pts      = EXCLUDED.r64_pts,
        r32_pts      = EXCLUDED.r32_pts,
        s16_pts      = EXCLUDED.s16_pts,
        e8_pts       = EXCLUDED.e8_pts,
        f4_pts       = EXCLUDED.f4_pts,
        champ_pts    = EXCLUDED.champ_pts,
        max_possible = EXCLUDED.max_possible,
        updated_at   = NOW()
    `;
  }
}
