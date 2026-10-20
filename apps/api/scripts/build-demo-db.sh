#!/usr/bin/env bash
# Vercel build for the hosted demo: SQLite Prisma client, a seeded demo database, then the Nest build.
set -euo pipefail
cd "$(dirname "$0")/.."

SCHEMA=prisma/sqlite/schema.prisma
export DATABASE_URL="file:$PWD/prisma/demo.db"

node scripts/make-sqlite-schema.cjs
rm -f prisma/demo.db prisma/demo.db-journal
npx prisma generate --schema "$SCHEMA"
npx prisma db push --schema "$SCHEMA" --skip-generate
npx tsx prisma/seed.ts
npx nest build
echo "Demo database ready: $(du -h prisma/demo.db | cut -f1)"
