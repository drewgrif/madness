#!/usr/bin/env node
// Change a user's password
// Usage: node scripts/change-password.js <username> <newpassword>

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^([^=#]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const [,, username, newPassword] = process.argv;
if (!username || !newPassword) {
  console.error('Usage: node scripts/change-password.js <username> <newpassword>');
  process.exit(1);
}

const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error('No database URL found'); process.exit(1); }

const sql = neon(url);

(async () => {
  const hash = await bcrypt.hash(newPassword, 10);
  const rows = await sql`
    UPDATE users SET password = ${hash}
    WHERE username = ${username}
    RETURNING id, username
  `;
  if (rows.length === 0) {
    console.error(`User "${username}" not found`);
    process.exit(1);
  }
  console.log(`Password updated for ${rows[0].username} (id=${rows[0].id})`);
})();
