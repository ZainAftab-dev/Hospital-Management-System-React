/**
 * db-bootstrap.cjs
 * ----------------------------------------------------------------
 * Connects to SQL Server's `master` database and creates the
 * `zm_hospital` database if it does not already exist.
 *
 * Doubles as the "is SQL Server ready?" probe: if the server is not
 * accepting connections yet, this script exits non-zero and the
 * container entrypoint retries until it succeeds.
 * ----------------------------------------------------------------
 */
const { PrismaClient } = require('@prisma/client');

const base = process.env.DATABASE_URL;
if (!base) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

// Point the same connection string at the `master` database so we can
// issue CREATE DATABASE before the app database exists.
const masterUrl = base.replace(/database=[^;]+/i, 'database=master');

const prisma = new PrismaClient({ datasources: { db: { url: masterUrl } } });

(async () => {
  await prisma.$connect();
  // CREATE DATABASE cannot run inside a transaction — $executeRawUnsafe
  // runs it in autocommit mode, which is exactly what we need.
  await prisma.$executeRawUnsafe(
    "IF DB_ID('zm_hospital') IS NULL CREATE DATABASE [zm_hospital];"
  );
  console.log('      Database "zm_hospital" is present and ready.');
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error('      db-bootstrap: ' + (err.message || err).split('\n')[0]);
  try { await prisma.$disconnect(); } catch (_) {}
  process.exit(1);
});
