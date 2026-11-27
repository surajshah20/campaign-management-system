# Agency OS — Production Deployment Guide

This guide covers deploying Agency OS to production environments with enterprise-grade security, PostgreSQL persistence, and high availability.

---

## 1. Production Architecture Overview

```
[ Browser / Client Portal ]
          │
          ▼ HTTPS
┌───────────────────────────────────────┐
│     Frontend (Vite / React SPA)       │
│  - Cloudflare Pages / Vercel / Nginx │
└──────────────────┬────────────────────┘
                   │ /api/* (HTTPS + Secure HTTP-Only Cookies)
                   ▼
┌───────────────────────────────────────┐
│     Backend API (Node.js / Express)   │
│  - Render / Railway / Fly.io / ECS    │
│  - Helmet + Rate Limiter + JWT/RBAC   │
└──────────────────┬────────────────────┘
                   │
                   ▼ SSL (Port 5432)
┌───────────────────────────────────────┐
│     PostgreSQL Database Engine        │
│  - Supabase / Neon / AWS RDS / Aurora │
│  - Multi-tenant foreign key isolation │
└───────────────────────────────────────┘
```

---

## 2. Production Environment Variables Checklist

### Backend (`server/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Must be `production` | `production` |
| `PORT` | API listen port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/agency_os?schema=public` |
| `JWT_SECRET` | Cryptographic session key (min 32 chars) | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Token expiration period | `7d` |
| `CORS_ORIGIN` | Authorized client domain | `https://app.youragency.com` |
| `DEFAULT_CURRENCY` | Default baseline currency | `NPR` (or `USD`, `EUR`, `GBP`, `INR`) |

> [!IMPORTANT]
> The backend automatically validates environment configuration on startup in production. If `JWT_SECRET` is unset, default, or under 32 characters, the process exits with a fatal error to protect credentials.

### Frontend (`client/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL of the backend API | `https://api.youragency.com` (leave empty if behind reverse proxy) |

---

## 3. Recommended Cloud Deployment (PaaS)

### Step 1: Managed PostgreSQL Database (Supabase or Neon)
1. Create a free/pro PostgreSQL project at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy the connection string: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public`.
3. In `server/prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Push database schema:
   ```bash
   cd server
   npx prisma db push
   ```

### Step 2: Backend API (Render, Railway, or Fly.io)
1. Connect your GitHub repository to [Railway](https://railway.app) or [Render](https://render.com).
2. Set Root Directory to `server`.
3. Set Build Command: `pnpm install && npx prisma generate && pnpm run build`.
4. Set Start Command: `node dist/server.js`.
5. Add the environment variables from the checklist above.

### Step 3: Frontend (Cloudflare Pages or Vercel)
1. Connect repository to [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com).
2. Set Root Directory to `client`.
3. Set Build Command: `npm run build`.
4. Set Output Directory: `dist`.
5. Add Environment Variable:
   - `VITE_API_URL`: Your backend API URL (e.g. `https://api.youragency.com`).

---

## 4. Docker Deployment (Self-Hosted / VPS)

For deploying on a single Virtual Private Server (Ubuntu/Debian on DigitalOcean, AWS EC2, or Hetzner):

1. Clone repository to server:
   ```bash
   git clone https://github.com/surajshah20/campaign-management-system.git
   cd campaign-management-system
   ```
2. Configure `.env` using `.env.production.example`.
3. Start database and API with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
4. Reverse Proxy with Nginx / Caddy:
   Route incoming HTTPS requests to:
   - Frontend static build at `/var/www/agency-os/client/dist`
   - `/api/` reverse-proxied to `http://localhost:5000`

---

## 5. Security & Maintenance

* **Rate Limiting**: Built-in `express-rate-limit` prevents brute-force attempts on `/api/v1/auth/login` (20 attempts / 15 min window) and throttles general API traffic.
* **Audit Logging**: All administrative actions (user invite, client edit, role changes, asset approvals) are automatically recorded in `activityLog`.
* **Database Backups**: Configure daily automated snapshot backups on your PostgreSQL provider.
