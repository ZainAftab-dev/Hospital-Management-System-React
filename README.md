<div align="center">

# 🏥 ZM Hospital Management System

### A full-stack, production-ready Hospital Management System

Manage patients, doctors, appointments, pharmacy, billing and analytics — all in one secure, role-based web application backed by a real SQL Server database.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-API-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Azure SQL](https://img.shields.io/badge/Azure%20SQL-Database-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**🔗 Live app:** [hospital-management-system-react-ap.vercel.app](https://hospital-management-system-react-ap.vercel.app)

</div>

---

## 📋 Overview

ZM HMS is a complete hospital operations platform built with a modern, decoupled architecture: a **Next.js / React** frontend, a **NestJS REST API** with JWT authentication and role-based access control, and a **Microsoft SQL Server** database managed through **Prisma ORM**.

Every staff role — Admin, Doctor, Receptionist, Pharmacist and General Staff — sees only the modules and actions they're permitted to use.

Two ways to run it:
- **Locally**, the entire stack runs with a **single Docker command**, automatically seeding a realistic hospital dataset on first launch.
- **In production**, the three layers are deployed independently — see [☁️ Live Deployment](#️-live-deployment) below.

---

## ✨ Key Features

| Module | Capabilities |
|--------|--------------|
| 🧑‍⚕️ **Patients** | Full registration, medical details, blood group, allergies, emergency contacts, search |
| 👨‍⚕️ **Doctors** | Profiles, specializations, qualifications, availability, consultation fees |
| 📅 **Appointments** | Scheduling, status tracking (Pending / Confirmed / Completed / Cancelled), reschedule & cancel |
| 💊 **Pharmacy** | Medicine inventory, low-stock alerts, prescription **dispensing with automatic stock deduction** |
| 🧾 **Billing** | Invoice generation, discounts & tax, payment status, **PDF invoice download** |
| 📊 **Analytics** | Hospital KPIs, revenue, doctor performance, appointment breakdowns |
| 📄 **Reports** | Patient & billing reports exported as professional PDFs |
| 👥 **Users** | Staff management with five roles and account status control |

### 🔐 Security & Access Control
- **httpOnly cookie-based JWT** — token is never accessible to JavaScript; 8-hour expiry, bcrypt-hashed passwords
- **Role-Based Access Control (RBAC)** enforced per API endpoint with inactive-account check on every request
- **Login rate limiting** — in-memory sliding-window limiter (5 attempts / 15 min per IP)
- **Request body size cap** — 10 KB limit on all API requests to prevent payload-flooding
- **Pagination on all list endpoints** — max 1 000 records per request, configurable via `?take=&skip=`
- **Doctor scheduling conflict detection** — duplicate appointment time rejected with 409 Conflict
- **Comprehensive input validation** — DTO whitelisting, `MaxLength` on every free-text field, format checks (HH:MM time, URL pattern, currency format)
- **DB-level CHECK constraints** — valid statuses, non-negative amounts, allowed payment modes enforced at the database layer
- **CORS locked** to the configured web origin (never `*`); `credentials: true` for cross-origin cookie forwarding
- **Cookie attributes adapt to environment** — `SameSite=None; Secure` in production (frontend and API live on different domains), `SameSite=Lax` in local dev (same-origin, plain HTTP)
- **`JWT_SECRET` is required, not optional** — the API refuses to boot rather than silently falling back to an insecure default

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS · shadcn/ui (Radix primitives)
- jsPDF + html2canvas for client-side PDF generation

**Backend**
- NestJS 10 · Prisma ORM 6
- Passport JWT · bcryptjs · class-validator · cookie-parser

**Database**
- Microsoft SQL Server 2022
- Views, triggers, stored procedures, indexes & CHECK constraints

**DevOps**
- Docker & Docker Compose (3-service stack) for local development
- Vercel · Railway · Azure SQL Database for the live deployment (see below)

---

## 🏗️ Architecture (Local / Docker Compose)

```mermaid
flowchart LR
    A[Browser] -->|HTTPS| B[Next.js Web<br/>:3000]
    B -->|REST + httpOnly cookie JWT| C[NestJS API<br/>:4000]
    C -->|Prisma ORM| D[(SQL Server<br/>:1433)]

    subgraph Docker Compose
      B
      C
      D
    end
```

The frontend never talks to the database directly — all data flows through the authenticated API layer, keeping business logic and credentials safely server-side.

---

## ☁️ Live Deployment

Production doesn't use Docker Compose — each layer is hosted independently, since a NestJS server and a real SQL Server instance aren't things a frontend-only host like Vercel can run:

```mermaid
flowchart LR
    A[Browser] -->|HTTPS| B["Next.js Web<br/>Vercel<br/>(Root Directory: apps/web)"]
    B -->|REST + cross-site cookie JWT| C["NestJS API<br/>Railway<br/>(Root Directory: apps/api)"]
    C -->|Prisma ORM, TLS| D[(Azure SQL Database<br/>zm_hospital)]
```

| Layer | Host | Why |
|-------|------|-----|
| **Web** (`apps/web`) | [Vercel](https://vercel.com) | Purpose-built Next.js hosting; only ever runs the frontend as serverless functions |
| **API** (`apps/api`) | [Railway](https://railway.app) | NestJS needs a persistent, always-on process — something serverless hosting can't provide |
| **Database** | [Azure SQL Database](https://azure.microsoft.com/products/azure-sql/database) | Managed Microsoft SQL Server — self-hosting the real engine needs ~2 GB RAM, more than typical low-cost container plans allow |

### Environment variables that wire it together

**Vercel project → Settings → Environment Variables**
```
NEXT_PUBLIC_API_BASE_URL=https://<your-api>.up.railway.app/api
```

**Railway `api` service → Variables**
```
DATABASE_URL=sqlserver://<server>.database.windows.net:1433;database=zm_hospital;user=<user>;password=<password>;encrypt=true;trustServerCertificate=false
JWT_SECRET=<long random string — required, the API refuses to boot without it>
WEB_ORIGIN=https://<your-frontend>.vercel.app
API_PORT=4000
NODE_ENV=production
```

`NODE_ENV=production` specifically controls the auth cookie's `SameSite`/`Secure` flags (see [Security & Access Control](#-security--access-control)) — without it, login will appear to succeed but the session cookie won't survive the redirect, since the frontend and API are on different domains in this topology.

### Deploying this yourself
1. **Vercel**: import the repo, set **Root Directory** to `apps/web` (Vercel then auto-detects Next.js and installs from the monorepo root automatically).
2. **Railway**: new project from the same repo, one service with **Root Directory** `apps/api`, Builder set to use `apps/api/Dockerfile` (it already handles DB bootstrap, schema push, seeding, and starting the API in the right order — see `apps/api/docker-entrypoint.sh`).
3. **Database**: create an Azure SQL Database (the free tier is enough), add a firewall rule allowing Railway's traffic, then run once against it: `npx prisma db push`, `npx tsx prisma/seed.ts`, `node prisma/seed-users.cjs`, `node add-constraints.js`, `node docker/apply-db-objects.cjs` (all from `apps/api`, with `DATABASE_URL` pointed at Azure).
4. Set the environment variables above on each service, then redeploy both.

A quick way to confirm the API is actually reachable and connected: `GET /api/health` returns `{"status":"ok"}` regardless of the database, while `GET /api/patients` (expect a `401 Unauthorized`, not a `500`) confirms the database connection itself is working.

---

## 🗄️ Database Engineering Highlights

This isn't just CRUD on top of tables — the schema includes real relational database engineering:

- **9 related tables** with foreign keys (Patients, Doctors, Appointments, Medicines, Invoices, Invoice Items, Dispensations, Dispensation Items, Users)
- **4 Views** — `vw_PatientSummary`, `vw_DoctorSchedule`, `vw_PharmacyStock`, `vw_BillingOverview`
- **4 Triggers** — automatic audit logging on patient insert/update/delete and invoice status changes
- **4 Stored Procedures** — `sp_GetPatientHistory`, `sp_GetLowStockMedicines`, `sp_GetDoctorStats`, `sp_GetMonthlyRevenue`
- **~25 CHECK constraints** — data-integrity rules (valid roles, age ranges, non-negative amounts, invoice statuses: DRAFT / UNPAID / PAID / CANCELLED, payment modes: Cash / Card / Online / Bank Transfer / Insurance)
- **9 indexes** on frequently queried columns
- **Transactional pharmacy dispensing** — stock check, deduction, invoice line items and totals all in one atomic transaction

---

## 🚀 Getting Started (local development)

> These options run the whole stack on your own machine. For how it's actually hosted live, see [☁️ Live Deployment](#️-live-deployment).

### Option A — Docker (recommended, one command)

> Requires only [Docker Desktop](https://www.docker.com/products/docker-desktop/). No need to install Node.js or SQL Server.

```bash
git clone https://github.com/ZainAftab-dev/Hospital-Management-System-React.git
cd Hospital-Management-System-React
docker compose up --build
```

Then open **http://localhost:3000**.

On first run the system automatically creates the database, applies the schema, seeds demo data (20 patients, 20 doctors, appointments, invoices, 30 medicines), and installs all views, triggers, procedures and constraints.

📖 Full Docker guide: **[DOCKER_README.md](DOCKER_README.md)**

> 💡 **Windows users:** just double-click **`START_DOCKER.bat`**.

### Option B — Manual (local Node.js + SQL Server)

```bash
# 1. Install dependencies
npm install

# 2. Configure apps/api/.env with your SQL Server connection string

# 3. Prepare the database
npm run prisma:generate
npm run prisma:migrate
npm run seed

# 4. Run web + API together
npm run dev
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@zmhospital.com` | `Admin@12345` |
| **Pharmacist** | `pharmacy@zmhospital.com` | `Pharmacy@12345` |
| **Receptionist** | `reception@zmhospital.com` | `Reception@12345` |
| **Doctor** | `dr.aisha@zmhospital.com` | `Doctor@12345` |
| **Staff** | `staff@zmhospital.com` | `Staff@12345` |

---

## 📁 Project Structure

```
.
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   │   ├── app/             # Pages (dashboard, login)
│   │   ├── components/      # Module workspaces + UI components
│   │   └── lib/             # API client, PDF utils, error boundary
│   └── api/                 # NestJS backend
│       ├── src/             # Auth, patients, doctors, appointments,
│       │                    #   pharmacy, billing, users, health modules
│       ├── prisma/          # Schema, migrations, seed data
│       ├── docker/          # DB bootstrap & object scripts
│       └── Dockerfile       # Used by Railway to build/run the API in production
├── docker-compose.yml       # 3-service stack (db + api + web) — local dev only
├── DOCKER_README.md         # Docker startup guide (local dev)
├── START_DOCKER.bat         # One-click Docker launcher (Windows)
├── STOP_DOCKER.bat          # One-click Docker stop (Windows)
├── START_HMS.bat            # Local (non-Docker) launcher — starts built API + web
└── HMS_Queries.sql          # Reference SQL queries for all major operations
```

---

## 🗺️ Roadmap

- [ ] Lab results & radiology modules
- [ ] IPD / bed management
- [ ] Patient portal & telemedicine
- [ ] Email / SMS notifications
- [ ] HL7 / FHIR compliance

---

## 👤 Author

**Zain Aftab**
🔗 GitHub: [@ZainAftab-dev](https://github.com/ZainAftab-dev)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">

⭐ If you find this project useful, consider giving it a star!

</div>
