# DevX Commerce Suite — Deployment Guide

This guide explains how to deploy the **DevX Commerce Suite** (CartX, SearchX, RetailOS) to production.

---

## 1. Architecture: Should Backend & Frontend Be Separated?

**Yes, absolutely.** Backend and frontends should be deployed separately because they have completely different runtime models:

| Component | Nature | Recommended Production Host | Why? |
|---|---|---|---|
| **Backend API (`apps/api`)** | Stateful Node.js + Fastify + SQLite WAL | **Render**, **Railway**, **Fly.io**, or **VPS (Docker)** | Needs a persistent disk to preserve SQLite database transactions (`cartx.db`) and WAL journals without data loss on reboot. |
| **Frontends (`console`, `demo-store`, `retailos`)** | Static Single Page Apps (Vite + React) | **Vercel**, **Netlify**, or **Cloudflare Pages** | Pure static files (HTML, JS, CSS). Global CDN edge caching gives instant sub-second load times worldwide with zero server maintenance. |
| **Widget (`packages/widget`)** | Compiled `<10kB` JS bundle (`cartx.js`) | Served by Backend (`/cartx.js`) or CDN | Can be loaded into any external store via a `<script>` tag. |

---

## 2. Option A: Modern Cloud Deployment (Recommended)

### Step 1: Deploy Backend API on Render or Railway

#### On Render.com:
1. Create a **New Web Service** and connect your Git repository.
2. Configure settings:
   - **Root Directory**: `apps/api` (or monorepo root)
   - **Build Command**: `npm install --include=dev && npm run build -w @cartx/shared && npm run build -w @cartx/widget && npm run build -w @cartx/api`
   - **Start Command**: `npm run seed -w @cartx/api && npm start -w @cartx/api`
   - **Environment Variables**:
     - `PORT`: `4000` (or leave default, Fastify reads `process.env.PORT`)
     - `DATA_DIR`: `/var/data`
     - `DB_PATH`: `/var/data/cartx.db`
3. Attach a **Persistent Disk**:
   - Mount path: `/var/data`
   - Size: 1 GB (sufficient for millions of SQLite transactions)
4. Copy your backend live URL: e.g. `https://devx-api.onrender.com`

---

### Step 2: Deploy Frontends on Vercel

You can deploy the 3 frontend apps as 3 separate Vercel projects from the same repository:

#### 1. Storefront (`apps/demo-store`)
- **Root Directory**: `apps/demo-store`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE`: `https://devx-api.onrender.com`
  - `VITE_CONSOLE_URL`: `https://your-console.vercel.app`
  - `VITE_RETAILOS_URL`: `https://your-retailos.vercel.app`

#### 2. Merchant Admin Console (`apps/console`)
- **Root Directory**: `apps/console`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE`: `https://devx-api.onrender.com`
  - `VITE_STORE_URL`: `https://your-store.vercel.app`
  - `VITE_RETAILOS_URL`: `https://your-retailos.vercel.app`

#### 3. RetailOS POS Terminal (`apps/retailos`)
- **Root Directory**: `apps/retailos`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE`: `https://devx-api.onrender.com`
  - `VITE_STORE_URL`: `https://your-store.vercel.app`
  - `VITE_CONSOLE_URL`: `https://your-console.vercel.app`

---

## 3. Option B: All-in-One Container (Single Server / VPS / Docker)

If you prefer to deploy everything onto a single Virtual Private Server (DigitalOcean Droplet, AWS EC2, Hetzner, Railway, etc.):

Use the included [`Dockerfile`](file:///d:/REA/devx-commerce/Dockerfile) and [`docker-compose.yml`](file:///d:/REA/devx-commerce/docker-compose.yml):

```bash
# Build and run all services in containers
docker compose up -d --build
```

---

## 4. Environment Variables Reference

| Variable | Target App | Purpose | Default |
|---|---|---|---|
| `PORT` | API | HTTP listening port | `4000` |
| `DATA_DIR` | API | Directory storing SQLite database & WAL | `./data` |
| `DB_PATH` | API | Direct path to SQLite file | `./data/cartx.db` |
| `VITE_API_BASE` | Frontends | URL of the live Fastify backend | `http://localhost:4000` |
| `VITE_STORE_URL` | Console, RetailOS | Cross-link to Demo Storefront | `http://localhost:5174` |
| `VITE_CONSOLE_URL` | Storefront, RetailOS | Cross-link to Merchant Console | `http://localhost:5173` |
| `VITE_RETAILOS_URL` | Storefront, Console | Cross-link to Touchscreen POS | `http://localhost:5175` |

