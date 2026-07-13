# ZM Hospital Management System — Setup Guide

Everything runs inside Docker. You do **not** need to install Node.js, SQL Server, or any other software.

---

## Step 1 — Install Docker Desktop

Download and install Docker Desktop for your operating system:

**https://www.docker.com/products/docker-desktop/**

After installation:
1. Open **Docker Desktop**
2. Wait until the status shows **"Running"** (green icon in the taskbar)
3. Go to **Settings → Resources** and make sure **Memory is set to at least 4 GB**
   *(SQL Server requires this — the app will not start correctly with less)*

---

## Step 2 — Extract the ZIP

Unzip `ZM-HMS-Docker.zip` to any folder on your computer, for example:

```
C:\ZM-HMS\
```

---

## Step 3 — Start the System

**Windows:** double-click **`START_DOCKER.bat`** inside the extracted folder.

**Mac / Linux:** open a terminal inside the extracted folder and run:

```bash
docker compose up --build
```

> **First run takes 5–10 minutes.** Docker needs to download the SQL Server image and build both the API and web app. Every start after that takes under 30 seconds.

---

## Step 4 — Wait for the Ready Message

Watch the terminal output. The system is fully ready when you see:

```
Starting HMS API on port 4000
```

Do not open the browser until this message appears. If you open it too early the login will fail because the database is still being set up — just wait and refresh.

---

## Step 5 — Open the App

Go to: **http://localhost:3000**

---

## Login Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@zmhospital.com` | `Admin@12345` |
| **Pharmacist** | `pharmacy@zmhospital.com` | `Pharmacy@12345` |
| **Receptionist** | `reception@zmhospital.com` | `Reception@12345` |
| **Doctor** | `dr.aisha@zmhospital.com` | `Doctor@12345` |
| **Staff** | `staff@zmhospital.com` | `Staff@12345` |

Each role sees only the modules it is permitted to use.

---

## Stopping & Restarting

| Action | How |
|--------|-----|
| **Stop** (keeps your data) | Double-click `STOP_DOCKER.bat` — or run `docker compose down` |
| **Start again** | Double-click `START_DOCKER.bat` — or run `docker compose up` |
| **Wipe all data and start fresh** | Run `docker compose down -v` then start again |

---

## Troubleshooting

**"Port already in use" on 3000 or 4000**
Another application is using that port. Stop it, or open `docker-compose.yml` and change the left side of the port mapping — for example `"3001:3000"` — then open the new port number in your browser.

**Login fails or data is empty after opening the browser**
The database is still seeding on first run. In the terminal run:
```bash
docker compose logs -f api
```
Wait until you see `Starting HMS API on port 4000`, then refresh the page.

**SQL Server keeps restarting / crashing**
Docker Desktop does not have enough memory. Go to **Docker Desktop → Settings → Resources** and increase Memory to at least **4 GB**.

**Running on an Apple Silicon Mac (M1 / M2 / M3)**
The system works but SQL Server runs under emulation, so the first boot will be slower than on Intel. Everything functions normally once started.

---

## Useful Terminal Commands

```bash
docker compose logs -f        # live logs from all services
docker compose logs -f api    # live logs from the API only
docker compose ps             # check which containers are running
docker compose down           # stop (data is kept)
docker compose down -v        # stop and delete all data
```

---

*For a full technical overview see `README.md`. For more Docker details see `DOCKER_README.md`.*
