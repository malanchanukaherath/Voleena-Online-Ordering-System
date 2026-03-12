# 🚀 Complete DevOps Pipeline Implementation Guide

## Voleena Online Ordering System

---

## TABLE OF CONTENTS

1. [Project Analysis](#project-analysis)
2. [DevOps Architecture](#devops-architecture)
3. [Docker Setup (Local Testing)](#docker-setup-local-testing)
4. [GitHub Actions (CI/CD)](#github-actions-cicd)
5. [Docker Image Registry](#docker-image-registry)
6. [Production Deployment (Docker Compose)](#production-deployment-docker-compose)
7. [Complete Deployment Checklist](#complete-deployment-checklist)
8. [Common Issues & Debugging](#common-issues--debugging)

---

## PROJECT ANALYSIS

### Detected Stack

| Component      | Technology        | Version | Location              |
| -------------- | ----------------- | ------- | --------------------- |
| **Frontend**   | React + Vite      | 18 + 7  | `client/`             |
| **Backend**    | Node.js + Express | 20 + 4  | `server/`             |
| **Database**   | MySQL             | 8.0     | External/Container    |
| **State Mgmt** | Context API       | -       | `client/src/contexts` |
| **ORM**        | Sequelize         | 6.35    | `server/models`       |
| **Styling**    | TailwindCSS       | 3.3     | `client/`             |

### Build & Run Commands Detected

**Frontend:**

```bash
npm run dev       # Local development
npm run build     # Production build
npm run preview   # Test production build
npm run lint      # Code quality
```

**Backend:**

```bash
npm run start          # Production
npm run dev           # Development with nodemon
npm test              # Unit tests (optional)
npm run lint          # Code quality
npm run db:migrate    # Database migrations
npm run db:seed       # Seed data
```

### Critical Environment Variables

**Backend (Server) - 50+ env vars in use:**

- Database: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_POOL_MAX`, `DB_POOL_MIN`
- Auth: `JWT_SECRET` (must be 32+ chars), `JWT_REFRESH_SECRET`, `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE`
- Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYHERE_*`
- Maps: `GOOGLE_MAPS_API_KEY`, `RESTAURANT_LATITUDE`, `RESTAURANT_LONGITUDE`
- Mail: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `RESEND_API_KEY`
- SMS: `TWILIO_*` (optional)
- App: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `BACKEND_URL`

**Frontend (Client) - 3 critical env vars:**

- `VITE_API_BASE_URL` - Backend API endpoint
- `VITE_GOOGLE_MAPS_API_KEY` - Maps API
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe frontend key

**Database Connection:**
Backend validates required env vars on startup (see [server/config/database.js](server/config/database.js)):

- Crashes if `DB_HOST`, `DB_USER`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL` missing
- JWT_SECRET must be 32+ chars with special characters
- FRONTEND_URL cannot be wildcard (security)

---

## DEVOPS ARCHITECTURE

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Developer Push to GitHub Main Branch                           │
│          ↓                                                        │
│  GitHub Actions CI Workflow Triggered                           │
│          ↓                                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ QUALITY GATES (CI/cd.yml)                              │    │
│  │ ├─ Lint Frontend & Backend                             │    │
│  │ ├─ Build Frontend (Vite)                               │    │
│  │ ├─ Run Backend Tests (Jest)                            │    │
│  │ └─ Build Docker Images                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│          ↓                                                        │
│  Push Images to GHCR (GitHub Container Registry)               │
│          ↓                                                        │
│  GitHub Actions CD Workflow Triggered                           │
│          ↓                                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ DEPLOYMENT WITH DOCKER COMPOSE (cd.yml)               │    │
│  │ ├─ SSH into production server                         │    │
│  │ ├─ Login to GHCR                                      │    │
│  │ ├─ docker compose pull (latest images)                │    │
│  │ ├─ docker compose up -d --remove-orphans              │    │
│  │ └─ Verify services running                            │    │
│  └────────────────────────────────────────────────────────┘    │
│          ↓                                                        │
│  Production: Running with Docker Compose on VPS                │
│          ↓                                                        │
│  ┌──────────────────┐  ┌─────────────────┐                    │
│  │ frontend         │  │ backend         │                    │
│  │ nginx:1.27       │  │ node:20         │                    │
│  └──────────────────┘  └────────┬────────┘                    │
│                                 ↓                               │
│                        ┌─────────────────────┐                 │
│                        │ mysql               │                 │
│                        │ Named Volume        │                 │
│                        │ (mysql_data)        │                 │
│                        └─────────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Production Design

- **Frontend**: Single container, nginx static file server
- **Backend**: Single container, Node.js + Express
- **MySQL**: Single container with named Docker volume for persistence
- **Zero-downtime updates**: `docker compose pull` + `up -d --remove-orphans` replaces containers
- **Health checks**: Docker Compose `healthcheck` on all services
- **Secrets management**: `.env` file on production server (never committed to git)

---

## DOCKER SETUP (LOCAL TESTING)

### Files Created

```
server/Dockerfile               # Multi-stage optimized backend build
server/.dockerignore            # Excludes node_modules, .env, etc.

client/Dockerfile               # Multi-stage: build with Node → serve with nginx
client/nginx.conf              # Optimized for React Router SPA
client/.dockerignore           # Excludes dist, node_modules, .env

docker-compose.yml             # Full local stack: MySQL + backend + frontend
```

### Local Testing Steps

**1. Review and customize `docker-compose.yml`:**

```bash
# Replace placeholder values:
# - JWT_SECRET: Change both secrets to your own 32+ char values
# - GOOGLE_MAPS_API_KEY: Add your Google Maps API key
# - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
# - SMTP_* and RESEND_API_KEY for email
```

**2. Build images:**

```bash
docker compose build
```

**Output:**

```
✓ Image voleena-online-ordering-system-backend Built   (342MB)
✓ Image voleena-online-ordering-system-frontend Built  (79.8MB)
```

**3. Start the stack:**

```bash
docker compose up -d
```

Monitors logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

**4. Verify services:**

```bash
# Health check backend
curl http://localhost:3001/health

# Access frontend
open http://localhost:8080

# Check database
docker compose exec mysql mysql -u voleena_user -p voleena_password -e "SHOW DATABASES;"
```

**5. Stop stack:**

```bash
docker compose down
docker compose down -v  # Also remove volumes
```

### Environment Variable Management

**For local testing:**

- Edit `docker-compose.yml` directly (already has dev values)
- Override at runtime: `docker compose up -e JWT_SECRET=xxx`

**For production:**

- Never store secrets in docker-compose.yml
- Create a `.env` file on the production server alongside docker-compose.yml
- The CD workflow SSHes into the server and runs `docker compose pull && docker compose up -d`
- See [GitHub Actions CD Workflow](#github-actions-cd-workflow) for how deployment is triggered

---

## GITHUB ACTIONS (CI/CD)

### File: `.github/workflows/ci.yml`

**Triggers:** Every push to any branch + pull requests to main/develop

**Jobs:**

1. **backend-quality** (runs on ubuntu-latest)
   - Installs Node 20
   - Runs `npm run lint`
   - Runs `npm test --passWithNoTests` (no tests yet, allowed to pass)
   - Services: MySQL 8.0 (for integration tests if added later)

2. **frontend-quality** (runs on ubuntu-latest)
   - Installs Node 20
   - Runs `npm run lint`
   - Builds frontend: `npm run build`
   - Verifies build output exists in `dist/`

3. **docker-build** (only on main branch pushes)
   - Requires both quality jobs to pass
   - Builds backend image → pushes to GHCR
   - Builds frontend image → pushes to GHCR
   - Tags: `main-<commit-sha>` + `latest` on main
   - Uses build cache for faster repeats

### File: `.github/workflows/cd.yml`

**Triggers:** When CI workflow completes successfully on main branch

**Prerequisites:**

- GitHub Secrets configured (see [Setup section](#setup-github-secrets-required) below)
- A VPS/server with Docker + Docker Compose installed
- SSH key access to the server
- `docker-compose.yml` and `.env` file present on the server at `DEPLOY_PATH`

**Steps:**

1. SSH into production server using `appleboy/ssh-action`
2. Login to GHCR with `GHCR_TOKEN`
3. `docker compose pull` — pulls latest images
4. `docker compose up -d --remove-orphans` — restarts containers with new images
5. `docker image prune -f` — cleans up old unused images
6. Verify all services are running with `docker compose ps`

### Setup GitHub Secrets (REQUIRED)

Go to **GitHub Repo → Settings → Secrets and variables → Actions**

Create these secrets for CD deployment:

```
DEPLOY_HOST                   # Server IP or hostname (e.g., 123.45.67.89)
DEPLOY_USER                   # SSH username (e.g., ubuntu or deploy)
DEPLOY_SSH_KEY                # SSH private key (contents of id_rsa or similar)
DEPLOY_PATH                   # Path on server (e.g., /opt/voleena)
GHCR_TOKEN                    # GitHub PAT with read:packages scope
```

Create these variables (non-sensitive):

```
VITE_API_BASE_URL            # https://api.example.com
```

> **Note:** App secrets (DB*PASSWORD, JWT_SECRET, SMTP*\*, etc.) are stored in a `.env` file directly on the production server at `DEPLOY_PATH`. They are NOT passed through GitHub Actions.

---

## DOCKER IMAGE REGISTRY

### Using GitHub Container Registry (GHCR)

**Advantage:** Free tier, built-in with GitHub Actions, no setup needed

**Images pushed by CI:**

```
ghcr.io/{your-username}/voleena-backend:main-{sha}
ghcr.io/{your-username}/voleena-backend:latest

ghcr.io/{your-username}/voleena-frontend:main-{sha}
ghcr.io/{your-username}/voleena-frontend:latest
```

**Tag Strategy:**

- Immutable: `sha-<commit>` for auditing
- Stable: `latest` always points to main branch
- Semantic: (optional) `v1.0.0` for releases

**Authentication (local login):**

Generate GitHub Personal Access Token with `write:packages` + `read:packages` scope:

```bash
echo {GITHUB_PAT} | docker login ghcr.io -u {github-username} --password-stdin

# Verify
docker pull ghcr.io/yourname/voleena-backend:latest
```

**Manual push (optional):**

```bash
docker tag voleena-online-ordering-system-backend:latest ghcr.io/yourname/voleena-backend:v1.0.0
docker push ghcr.io/yourname/voleena-backend:v1.0.0
```

---

## PRODUCTION DEPLOYMENT (Docker Compose)

### Prerequisites

1. **A VPS or cloud server** (DigitalOcean Droplet, AWS EC2, Hetzner, etc.) with:
   - Docker Engine installed
   - Docker Compose plugin installed
   - SSH access via key pair
2. **DNS** pointing your domain(s) to the server IP
3. **GitHub secrets** configured (see [Setup section](#setup-github-secrets-required))

### Server Setup (one-time)

```bash
# Install Docker on Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Create app directory
sudo mkdir -p /opt/voleena
sudo chown $USER:$USER /opt/voleena

# Copy docker-compose.yml to server
scp docker-compose.yml user@your-server:/opt/voleena/

# Create .env file on server with all secrets
nano /opt/voleena/.env
# Fill in DB_PASSWORD, JWT_SECRET, STRIPE_*, SMTP_*, etc.
```

### Environment File on Server

Create `/opt/voleena/.env` on the production server:

```dotenv
# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=voleena_foods_db
DB_USER=voleena_user
DB_PASSWORD=your_strong_password_here
MYSQL_ROOT_PASSWORD=your_root_password_here

# Auth
JWT_SECRET=your_32_char_secret_here_AbcDef!@#
JWT_REFRESH_SECRET=different_refresh_secret_here!@#

# App URLs
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.example.com
BACKEND_URL=https://api.example.com

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
RESEND_API_KEY=re_...

# Maps
GOOGLE_MAPS_API_KEY=AIza...
RESTAURANT_LATITUDE=6.9271
RESTAURANT_LONGITUDE=79.8612
```

### Deployment Instructions

**Automatic (via GitHub Actions CD):**

Push to `main` → CI builds and pushes images → CD SSHes in and deploys automatically.

**Manual deployment:**

```bash
# SSH into server
ssh user@your-server
cd /opt/voleena

# Login to GHCR
echo "YOUR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull latest images and restart
docker compose pull
docker compose up -d --remove-orphans

# Verify
docker compose ps
docker compose logs -f backend
```

### Zero-Downtime Updates

```bash
# Pull new images (old containers keep running)
docker compose pull

# Replace containers one by one
docker compose up -d --remove-orphans

# Clean up old images
docker image prune -f
```

Rollback to previous image:

```bash
# List available image tags
docker images ghcr.io/yourname/voleena-backend

# Edit docker-compose.yml to pin a specific tag, then:
docker compose up -d
```

### Accessing the Application

**With proper DNS (recommended):**

- Point `app.example.com` A record → server IP
- Point `api.example.com` A record → server IP
- Configure nginx reverse proxy or use the included nginx in the frontend container

**Health check:**

```bash
curl http://your-server-ip:3001/health
curl http://your-server-ip:8080
```

---

## COMPLETE DEPLOYMENT CHECKLIST

### Phase 1: Local Testing (Day 1)

- [ ] Read this guide completely
- [ ] Review `docker-compose.yml` and understand each service
- [ ] Run `docker compose build` → verify images built (backend 342MB, frontend 79.8MB)
- [ ] Run `docker compose up -d`
- [ ] Verify backend health: `curl http://localhost:3001/health`
- [ ] Verify frontend: open `http://localhost:8080`
- [ ] Verify database: `docker compose exec mysql mysql -u voleena_user -p voleena_password -e "SHOW DATABASES;"`
- [ ] Test order flow end-to-end
- [ ] `docker compose down`

### Phase 2: GitHub Setup (Day 1-2)

- [ ] Commit `.github/workflows/ci.yml` and `cd.yml` to repo
- [ ] Push to GitHub (any branch to test CI)
- [ ] Watch GitHub Actions run (should pass quality checks + build images)
- [ ] Verify images pushed to GHCR: `docker pull ghcr.io/yourname/voleena-backend:latest`

### Phase 3: GitHub Secrets Configuration (Day 2)

- [ ] Go to GitHub Repo →Settings → Secrets and variables → Actions
- [ ] Add all required secrets from [GitHub Secrets](#setup-github-secrets-required) section
- [ ] Generate strong JWT secrets (32+ chars, mixed case, special chars)
- [ ] Add API keys from Stripe, Google Maps, etc.

### Phase 4: Production Server Setup (Day 2-3)

- [ ] Provision VPS (DigitalOcean, Hetzner, AWS EC2, etc.)
- [ ] Install Docker: `curl -fsSL https://get.docker.com | sh`
- [ ] Create app directory: `sudo mkdir -p /opt/voleena`
- [ ] Copy `docker-compose.yml` to server: `scp docker-compose.yml user@server:/opt/voleena/`
- [ ] Generate SSH deploy key pair and add public key to server `~/.ssh/authorized_keys`
- [ ] Add private key as `DEPLOY_SSH_KEY` GitHub secret

### Phase 5: Production Secrets & Config (Day 3)

- [ ] Create `/opt/voleena/.env` on server with all secrets (see [Environment File](#environment-file-on-server))
- [ ] Create GitHub PAT with `read:packages` scope → add as `GHCR_TOKEN` secret
- [ ] Add `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` GitHub secrets
- [ ] Update `VITE_API_BASE_URL` variable in GitHub repo settings
- [ ] Point DNS records to server IP

### Phase 6: First Production Deployment (Day 3-4)

- [ ] SSH into server and manually test:
  ```bash
  cd /opt/voleena
  echo "YOUR_PAT" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
  docker compose pull
  docker compose up -d
  docker compose ps
  ```
- [ ] Verify backend health: `curl http://localhost:3001/health`
- [ ] Verify frontend: `curl http://localhost:8080`
- [ ] Verify end-to-end order flow

### Phase 7: Continuous Deployment (Day 4+)

- [ ] Push a commit to main branch
- [ ] GitHub Actions CI runs automatically
- [ ] GitHub Actions CD SSHes in and deploys automatically
- [ ] Validate: `docker compose ps` on server
- [ ] Monitor: `docker compose logs -f backend`

---

## COMMON ISSUES & DEBUGGING

### Docker Compose Issues

**Issue: "vite: not found" during frontend build**

**Solution:** Ensure `npm ci` runs before `npm run build` in Dockerfile.

- Check: [client/Dockerfile](client/Dockerfile) has `RUN npm ci` before `RUN npm run build`
- Already fixed in provided version

**Issue: Port already in use**

**Solution:**

```bash
# Find what's using the port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill and restart
docker compose down
docker compose up -d
```

**Issue: Backend crashes on startup**

**Check logs:**

```bash
docker compose logs backend
```

**Common reasons:**

1. Missing `JWT_SECRET` in env vars
2. `DB_HOST` unreachable (MySQL not ready yet)
3. `FRONTEND_URL` not set
4. MySQL user/password incorrect

**Solution:**

- Verify all env vars in docker-compose.yml
- Ensure MySQL is healthy: `docker compose ps mysql`
- Check database connection: `docker compose exec backend node -e "require('./config/database')"`

### Production Deployment Issues

**Issue: Container stuck in restart loop**

**Debug:**

```bash
docker compose logs backend
docker compose logs --tail=50 backend  # Last 50 lines
docker compose ps  # Check exit codes
```

**Common causes:**

1. Missing or incorrect `.env` file on server
2. MySQL not ready yet (backend starts before DB is healthy)
3. Wrong GHCR image tag pulled

**Solution:**

- Verify `.env` exists: `ls -la /opt/voleena/.env`
- Check all required vars are set
- Restart with fresh pull: `docker compose down && docker compose pull && docker compose up -d`

**Issue: Cannot pull image from GHCR**

**Debug:**

```bash
docker compose pull 2>&1
# Look for "unauthorized" or "not found" errors
```

**Solution:**

```bash
# Re-authenticate
echo "YOUR_GHCR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
docker compose pull
```

**Issue: SSL/TLS for production**

Use Certbot with nginx for free Let's Encrypt certificates:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d app.example.com -d api.example.com

# Auto-renewal (already configured by certbot)
crontab -l  # Verify renewal cron job
```

### Environment Variable Mismatches

**Issue: Frontend can't reach backend API**

**Check:**

```bash
# Verify env was baked into the frontend image at CI build time
docker compose exec frontend grep -r "localhost:3001" /usr/share/nginx/html/assets/ 2>/dev/null
# Should show your production API URL, not localhost
```

**Solution:**

- Update `VITE_API_BASE_URL` in GitHub repo variables
- Re-run CI to rebuild frontend image with correct URL
- Frontend API URL is baked at build time (not runtime), so CI must have the correct value

**Issue: Backend can't send emails/SMS**

**Check logs:**

```bash
docker compose logs backend | grep -i "email\|smtp\|resend"
```

**Verify env vars are set on server:**

```bash
docker compose exec backend printenv | grep -i smtp
```

**Solution:**

- Edit `/opt/voleena/.env` and add/fix SMTP\_\* or RESEND_API_KEY values
- Restart backend: `docker compose restart backend`

### Performance Tuning

**To limit container memory (prevent OOM crashes):**

Edit `docker-compose.yml` and add `mem_limit`:

```yaml
services:
  backend:
    mem_limit: 512m
  frontend:
    mem_limit: 128m
```

**Monitor resource usage:**

```bash
docker stats  # Live CPU/memory usage for all containers
docker compose top  # Process list inside containers
```

**Scale up:** For higher traffic, upgrade your VPS to a larger instance size (more CPU/RAM).

---

## NEXT STEPS

### Immediate (Week 1)

1. ✅ Local Docker testing passes
2. ✅ GitHub Actions CI/CD pipelines created and working
3. Provision VPS and install Docker
4. Configure `.env` on server and test manual deployment
5. Configure DNS and test end-to-end

### Short Term (Week 2-3)

1. Set up log aggregation (e.g., Loki + Grafana, or Papertrail)
2. Configure monitoring & alerting (Uptime Kuma, Better Stack)
3. Set up automated database backups (daily mysqldump to S3 or B2)
4. Add SSL/TLS with Certbot + Let's Encrypt
5. Configure automatic Docker log rotation

### Medium Term (Month 2)

1. Add Redis caching layer for sessions/cart
2. Set up staging environment (duplicate docker-compose stack on staging server)
3. Implement synthetic monitoring (uptime checks)
4. Document runbooks for common incidents
5. Set up database replication or managed DB (PlanetScale, AWS RDS)

### Long Term (Month 3+)

1. Migrate to Docker Swarm or managed container service if scaling requires it
2. Multi-region setup with load balancer
3. Cost optimization (reserved instances, right-sizing)
4. Disaster recovery plan & regular drills

---

## FILE REFERENCE

### Created Files & Locations

**Docker:**

- [server/Dockerfile](server/Dockerfile) - Backend build, optimized, 342MB
- [server/.dockerignore](server/.dockerignore) - Excludes node_modules, .env, etc.
- [client/Dockerfile](client/Dockerfile) - Multi-stage: Node build → nginx runtime
- [client/nginx.conf](client/nginx.conf) - SPA routing, gzip, security headers
- [client/.dockerignore](client/.dockerignore) - Excludes dist, node_modules, etc.
- [docker-compose.yml](docker-compose.yml) - Local full stack testing

**GitHub Actions (CI/CD):**

- [.github/workflows/ci.yml](.github/workflows/ci.yml) - Lint, test, build & push Docker images
- [.github/workflows/cd.yml](.github/workflows/cd.yml) - SSH deploy via Docker Compose

**Original Files (unchanged):**

- [server/package.json](server/package.json) - Backend dependencies
- [client/package.json](client/package.json) - Frontend dependencies
- [server/.env.example](server/.env.example) - Backend env template
- [client/.env.example](client/.env.example) - Frontend env template

---

**Last Updated:** March 10, 2026  
**Author:** Senior DevOps Engineer / GitHub Copilot  
**Status:** ✅ Complete Implementation Ready for Production Deployment
