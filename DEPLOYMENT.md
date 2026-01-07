# SwipeTodo Deployment Guide

Deployment on Hetzner via Coolify.

## Prerequisites

- Coolify instance running on Hetzner
- Domain configured (e.g., `api.domain.de` for PocketBase)
- Git repository with this code

## Services

### PocketBase (Backend)

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
4. Import schema (Settings → Import collections) or run:
   ```bash
   ./setup_schema.sh admin@swipetodo.local yourpassword
   ```

## Mobile App Deployment

### Expo/EAS Build

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Configure EAS:
   ```bash
   cd mobile
   eas build:configure
   ```

3. Update `mobile/.env` with production PocketBase URL:
   ```env
   EXPO_PUBLIC_POCKETBASE_URL=https://api.domain.de
   ```

4. Build for iOS/Android:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

5. Submit to app stores:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Updating

**PocketBase updates:**
- Update `PB_VERSION` ARG in Dockerfile
- Redeploy
- Note: Data persists in volume

**Mobile app updates:**
- Push changes to repo
- Run `eas build` and `eas submit`

## Troubleshooting

**Magic Links not working:**
- Check SMTP settings in PocketBase admin
- Verify Resend API key is valid
- Check sender domain is verified in Resend

**Mobile app can't connect to PocketBase:**
- Verify `EXPO_PUBLIC_POCKETBASE_URL` is correct
- Check PocketBase is accessible at the configured URL
- Ensure HTTPS is working

## Local Development

```bash
# Start PocketBase
cd pocketbase && ./start.sh

# Start Mobile App
cd mobile && npx expo start
```

PocketBase: http://localhost:8090
Mobile: Expo Go app or simulator
