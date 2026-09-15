// The repo keeps a single `.env.local` at its root, shared by both apps and the
// scripts in `scripts/`. Next only looks inside each app's own directory, so
// both apps' next.config.js require this for local dev and local builds. On
// Vercel there is no such file and the real environment always wins — nothing
// here overwrites an existing value.
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT_ENV = join(__dirname, '.env.local');if (existsSync(ROOT_ENV)) {
  for (const line of readFileSync(ROOT_ENV, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
}
