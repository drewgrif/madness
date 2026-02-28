import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is not set');
    _sql = neon(url);
  }
  return _sql;
}

// Proxy so callers can use `sql\`...\`` directly
export const sql = new Proxy({} as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args) {
    return (getSql() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    const client = getSql();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function initDb() {
  const db = getSql();

  await db`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   VARCHAR(50)  NOT NULL UNIQUE,
      email      VARCHAR(255) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      role       VARCHAR(10)  NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS tournaments (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(255) NOT NULL,
      year         INTEGER      NOT NULL,
      status       VARCHAR(20)  NOT NULL DEFAULT 'setup',
      picks_locked BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS teams (
      id            SERIAL  PRIMARY KEY,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      name          VARCHAR(255) NOT NULL,
      short_name    VARCHAR(20)  NOT NULL,
      seed          INTEGER      NOT NULL CHECK (seed BETWEEN 1 AND 16),
      region        VARCHAR(20)  NOT NULL CHECK (region IN ('East','West','South','Midwest')),
      color         VARCHAR(7)   NOT NULL DEFAULT '#333333',
      UNIQUE(tournament_id, seed, region)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS games (
      id            SERIAL  PRIMARY KEY,
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      game_number   INTEGER NOT NULL,
      round         INTEGER NOT NULL CHECK (round BETWEEN 1 AND 6),
      region        VARCHAR(20),
      team1_id      INTEGER REFERENCES teams(id),
      team2_id      INTEGER REFERENCES teams(id),
      winner_id     INTEGER REFERENCES teams(id),
      next_game     INTEGER,
      next_slot     INTEGER CHECK (next_slot IN (1, 2)),
      UNIQUE(tournament_id, game_number)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS picks (
      id             SERIAL  PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id),
      tournament_id  INTEGER NOT NULL REFERENCES tournaments(id),
      game_number    INTEGER NOT NULL,
      picked_team_id INTEGER NOT NULL REFERENCES teams(id),
      is_correct     BOOLEAN,
      UNIQUE(user_id, tournament_id, game_number)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS scores (
      user_id        INTEGER NOT NULL REFERENCES users(id),
      tournament_id  INTEGER NOT NULL REFERENCES tournaments(id),
      total_points   INTEGER NOT NULL DEFAULT 0,
      r64_pts        INTEGER NOT NULL DEFAULT 0,
      r32_pts        INTEGER NOT NULL DEFAULT 0,
      s16_pts        INTEGER NOT NULL DEFAULT 0,
      e8_pts         INTEGER NOT NULL DEFAULT 0,
      f4_pts         INTEGER NOT NULL DEFAULT 0,
      champ_pts      INTEGER NOT NULL DEFAULT 0,
      max_possible   INTEGER NOT NULL DEFAULT 192,
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(user_id, tournament_id)
    )
  `;
}
