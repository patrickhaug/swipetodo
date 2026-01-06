# SwipeTodo Deployment Guide

Deployment on Hetzner via Coolify.

## Prerequisites

- Coolify instance running on Hetzner
- Domain configured (e.g., `app.domain.de` for frontend, `api.domain.de` for PocketBase)
- Git repository with this code

## Services

### 1. PocketBase (Backend)

**Coolify Configuration:**
- Type: Docker
- Build Pack: Dockerfile
- Dockerfile Path: `pocketbase/Dockerfile`
- Domains: `api.domain.de`
- Ports: 8090

**Persistent Storage:**
- Add volume: `/pb/pb_data` → persistent storage

**SMTP Configuration (for Magic Links):**
Configure in PocketBase Admin UI (`https://api.domain.de/_/`):
- Settings → Mail settings
- SMTP host: `smtp.resend.com`
- SMTP port: 465 (SSL)
- SMTP username: `resend`
- SMTP password: Your Resend API key
- Sender address: `noreply@domain.de`

**Initial Setup:**
1. Deploy PocketBase service
2. Open `https://api.domain.de/_/`
3. Create admin account
4. Import schema (Settings → Import collections) or create manually:
   - households collection
   - todos collection
   - Extend users collection with `household` and `display_name`

### 2. Frontend

**Coolify Configuration:**
- Type: Docker
- Build Pack: Dockerfile
- Dockerfile Path: `frontend/Dockerfile`
- Domains: `app.domain.de`
- Ports: 80

**Build Arguments:**
- `VITE_PB_URL`: `https://api.domain.de`

**Environment Variables:**
None required (URL is baked in at build time)

## Deployment Steps

1. **Deploy PocketBase first:**
   - Create new service in Coolify
   - Select Docker → Dockerfile
   - Point to `pocketbase/Dockerfile`
   - Configure domain and volume
   - Deploy

2. **Configure PocketBase:**
   - Access admin UI
   - Create admin account
   - Configure SMTP for Magic Links
   - Create/import collections

3. **Deploy Frontend:**
   - Create new service in Coolify
   - Select Docker → Dockerfile
   - Point to `frontend/Dockerfile`
   - Set `VITE_PB_URL` build argument to PocketBase URL
   - Configure domain
   - Deploy

## Updating

**Frontend updates:**
- Push to repo → Coolify auto-deploys (if configured)
- Or trigger manual redeploy in Coolify

**PocketBase updates:**
- Update `PB_VERSION` ARG in Dockerfile
- Redeploy
- Note: Data persists in volume

## Troubleshooting

**Magic Links not working:**
- Check SMTP settings in PocketBase admin
- Verify Resend API key is valid
- Check sender domain is verified in Resend

**CORS errors:**
- PocketBase handles CORS automatically for authenticated requests
- If issues persist, check domain configuration

**Frontend can't connect to PocketBase:**
- Verify `VITE_PB_URL` build argument is correct
- Check PocketBase is accessible at the configured URL
- Ensure HTTPS is working for both services

## Local Development

```bash
# Start PocketBase
cd pocketbase && ./start.sh

# Start Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173
PocketBase: http://localhost:8090
