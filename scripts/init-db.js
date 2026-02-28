#!/usr/bin/env node
// Run once to create all database tables and the admin user
// Usage: node scripts/init-db.js

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load .env.local if it exists
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^([^=#]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('\nError: set NETLIFY_DATABASE_URL before running this script');
  console.error('Example:');
  console.error('  NETLIFY_DATABASE_URL="postgresql://..." node scripts/init-db.js\n');
  process.exit(1);
}

const sql = neon(url);

async function main() {
  console.log('\n🏀 March Madness — initializing database...\n');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   VARCHAR(50)  NOT NULL UNIQUE,
      email      VARCHAR(255) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      role       VARCHAR(10)  NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ users table');

  await sql`
    CREATE TABLE IF NOT EXISTS tournaments (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(255) NOT NULL,
      year         INTEGER      NOT NULL,
      status       VARCHAR(20)  NOT NULL DEFAULT 'setup',
      picks_locked BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ tournaments table');

  await sql`
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
  console.log('✓ teams table');

  await sql`
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
  console.log('✓ games table');

  await sql`
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
  console.log('✓ picks table');

  await sql`
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
  console.log('✓ scores table');

  // Create admin user
  const existing = await sql`SELECT id FROM users WHERE username = 'admin'`;
  if (existing.length === 0) {
    const hash = await bcrypt.hash('changeme', 10);
    await sql`
      INSERT INTO users (username, email, password, role)
      VALUES ('admin', 'admin@madness.local', ${hash}, 'admin')
    `;
    console.log('✓ admin user created (username: admin, password: changeme)');
  } else {
    console.log('✓ admin user already exists');
  }

  console.log('\n✅ Database ready! You can now deploy and sign in.\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message, '\n');
  process.exit(1);
});
