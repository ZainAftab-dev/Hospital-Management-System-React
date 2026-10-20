// Vercel serverless entry for the hosted demo API.
// Each instance copies the pre-seeded SQLite demo database to /tmp (the only writable folder),
// moves the sample dates up to today, then serves the Nest app.
const fs = require('fs');
const path = require('path');

const SEED_DB = path.join(__dirname, '..', 'prisma', 'demo.db');
const LIVE_DB = '/tmp/hms-demo.db';
// The seed data's appointments start on this date; it is shifted to "today" on each fresh copy.
const SEED_ANCHOR = Date.UTC(2026, 4, 12);

async function shiftDatesToToday() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const offset = today - SEED_ANCHOR;
    if (offset === 0) return;

    const appointments = await prisma.appointment.findMany({ select: { id: true, date: true } });
    for (const a of appointments) {
      await prisma.appointment.update({ where: { id: a.id }, data: { date: new Date(a.date.getTime() + offset) } });
    }

    // Vitals: keep the spacing, but make the latest reading about an hour ago.
    const latest = await prisma.vital.findFirst({ orderBy: { recordedAt: 'desc' }, select: { recordedAt: true } });
    if (latest) {
      const vitalOffset = now.getTime() - 60 * 60 * 1000 - latest.recordedAt.getTime();
      const vitals = await prisma.vital.findMany({ select: { id: true, recordedAt: true } });
      for (const v of vitals) {
        await prisma.vital.update({ where: { id: v.id }, data: { recordedAt: new Date(v.recordedAt.getTime() + vitalOffset) } });
      }
    }

  } finally {
    await prisma.$disconnect();
  }
}

let ready;

async function prepare() {
  const fresh = !fs.existsSync(LIVE_DB);
  if (fresh) fs.copyFileSync(SEED_DB, LIVE_DB);
  process.env.DATABASE_URL = `file:${LIVE_DB}`;
  if (fresh) {
    try {
      await shiftDatesToToday();
    } catch (error) {
      console.error('Could not shift demo dates', error);
    }
  }
  const { getRequestHandler } = require('../dist/src/serverless');
  return getRequestHandler();
}

module.exports = async (req, res) => {
  ready ??= prepare().catch((error) => {
    ready = undefined;
    throw error;
  });
  const handle = await ready;
  handle(req, res);
};
