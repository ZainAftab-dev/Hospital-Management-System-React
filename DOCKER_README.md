# ZM Hospital Management System — Run with Docker

This package runs the **entire system** — database, backend API, and web
app — with a single command. You do **not** need to install Node.js,
SQL Server, or anything else. You only need **Docker Desktop**.

---

## What's inside

| Service | Technology | Port |
|---------|-----------|------|
| **Web app** | Next.js 15 / React 19 | http://localhost:3000 |
| **API** | NestJS + Prisma (JWT auth, role-based access) | http://localhost:4000/api |
| **Database** | Microsoft SQL Server 2022 | internal only |

On first start, the system automatically:
- creates the `zm_hospital` database,
- builds all tables from the schema,
- loads demo data (20 patients, 20 doctors, appointments, invoices, 30 medicines),
- creates a login for every staff role,
- applies all data-integrity rules (CHECK constraints),
- creates indexes, **4 views, 4 triggers, and 4 stored procedures**.

---

## Step 1 — Install Docker Desktop (one time)

Download and install from:
**https://www.docker.com/products/docker-desktop/**

Open Docker Desktop and wait until it shows **"Running"**.

---

## Step 2 — Start the system

**Windows:** double-click **`START_DOCKER.bat`**

**Mac / Linux / any terminal:**
```bash
docker compose up --build
```

The **first run** downloads the SQL Server image and builds the apps —
this can take **5–10 minutes**. After that, startup takes seconds.
The API seeds the database on first boot (~60–90 seconds) — please wait
for it to finish before logging in.

---

## Step 3 — Open the app

Go to **http://localhost:3000**

### Login accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@zmhospital.com` | `Admin@12345` |
| Pharmacist | `pharmacy@zmhospital.com` | `Pharmacy@12345` |
| Receptionist | `reception@zmhospital.com` | `Reception@12345` |
| Doctor | `dr.aisha@zmhospital.com` | `Doctor@12345` |
| Staff | `staff@zmhospital.com` | `Staff@12345` |

Each role sees only the modules it is allowed to use.

---

## Stopping & restarting

- **Stop:** double-click **`STOP_DOCKER.bat`** (or `docker compose down`).
  Your data is kept.
- **Start again:** `START_DOCKER.bat` (or `docker compose up`).
- **Reset everything (wipe data):** `docker compose down -v`

---

## Useful commands

```bash
docker compose logs -f        # watch live logs of all services
docker compose logs -f api    # watch just the API (seeding progress)
docker compose ps             # see running containers
docker compose down           # stop (keeps data)
docker compose down -v        # stop and delete all data
```

---

## Troubleshooting

**"Port is already in use" (3000 or 4000):**
Another app is using that port. Stop it, or edit `docker-compose.yml`
and change the left side of the port mapping, e.g. `"3001:3000"`, then
open the new port.

**The web app loads but login fails / data is empty:**
The database is probably still seeding on first run. Watch progress with
`docker compose logs -f api` and wait until you see
`Starting HMS API on port 4000`. Then refresh the page.

**SQL Server keeps restarting:**
SQL Server needs about **2 GB of RAM**. In Docker Desktop →
Settings → Resources, make sure at least **4 GB** is allocated.

**Apple Silicon (M1/M2/M3) Macs:**
SQL Server runs under emulation. It works but starts a little slower.

---

## Going to production (optional)

Before any real deployment, edit **`.env`** and set:
- a strong, unique `DB_SA_PASSWORD`
- a long random `JWT_SECRET`

To deploy on a server (not just localhost), rebuild the web image with
the public API URL:
```bash
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api web
```
and update `WEB_ORIGIN` for the API accordingly.

---

© 2026 ZM Hospital Management System.
