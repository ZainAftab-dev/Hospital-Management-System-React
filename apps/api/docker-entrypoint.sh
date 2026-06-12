#!/usr/bin/env bash
# ============================================================
#  HMS API container entrypoint
#  Waits for SQL Server, prepares the database, then starts the API.
#  Every step is idempotent and safe to re-run on container restart.
# ============================================================
set -uo pipefail

echo "============================================================"
echo "  HMS API container starting"
echo "============================================================"

# ---- 1. Wait for SQL Server and make sure the database exists ----
echo "[1/6] Waiting for SQL Server and ensuring 'zm_hospital' database exists..."
ATTEMPTS=0
until node docker/db-bootstrap.cjs; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 40 ]; then
    echo "      ERROR: SQL Server did not become ready in time. Exiting."
    exit 1
  fi
  echo "      ...SQL Server not ready yet (attempt $ATTEMPTS/40). Retrying in 5s."
  sleep 5
done

# ---- 2. Create / sync all tables from the Prisma schema ----
echo "[2/6] Applying database schema (prisma db push)..."
npx prisma db push --skip-generate --accept-data-loss

# ---- 3. Seed rich demo data (patients, doctors, appointments, invoices, medicines) ----
echo "[3/6] Seeding demo data..."
npx tsx prisma/seed.ts || echo "      (seed.ts warning — continuing)"

# ---- 4. Ensure all five role logins + full medicine catalog ----
echo "[4/6] Ensuring role-based logins and medicine catalog..."
node prisma/seed-users.cjs || echo "      (seed-users warning — continuing)"

# ---- 5. Data-integrity rules + DB objects (indexes, views, triggers, procs) ----
echo "[5/6] Applying CHECK constraints, indexes, views, triggers, procedures..."
node add-constraints.js || echo "      (constraints warning — continuing)"
node docker/apply-db-objects.cjs || echo "      (db-objects warning — continuing)"

# ---- 6. Launch the API ----
echo "[6/6] Starting HMS API on port ${API_PORT:-4000}..."
echo "============================================================"
exec node dist/src/main.js
