# RALPH Deployment Guide

Step-by-step guide to get RALPH live on the internet.

## Prerequisites

- GitHub account (free)
- Railway account (free tier available) OR Render account

## Step 1: Push to GitHub

### First time setup

1. Go to [github.com](https://github.com) and create an account
2. Click the **+** in the top right → **New repository**
3. Name it `ralph` (or whatever you want)
4. Keep it **Public** (or Private if you prefer)
5. **Don't** check "Add a README" (we have one)
6. Click **Create repository**

### Upload your code

**Option A: GitHub Website (easiest)**
1. On your new repo page, click **uploading an existing file**
2. Drag and drop the entire `ralph-github` folder contents
3. Click **Commit changes**

**Option B: Git command line**
```bash
cd ralph-github
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ralph.git
git push -u origin main
```

## Step 2: Deploy Backend to Railway

[Railway](https://railway.app) is the easiest way to deploy Python APIs.

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `ralph` repository
4. Railway will auto-detect it's Python
5. Click into the service → **Settings** → **Root Directory** → type `backend`
6. Add environment variable:
   - `DATABASE_URL` = leave empty (Railway provides one if you add PostgreSQL)
7. Click **Deploy**

Your API will be live at something like:
```
https://ralph-production-xxxx.up.railway.app
```

### Add PostgreSQL (recommended for production)

1. In Railway, click **+ New** → **Database** → **PostgreSQL**
2. It automatically sets `DATABASE_URL` for your app
3. Redeploy

## Step 3: Deploy Frontend to Vercel

[Vercel](https://vercel.com) is perfect for React apps.

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Import your `ralph` repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (or Create React App)
5. Add environment variable:
   - `VITE_API_URL` = your Railway URL (e.g., `https://ralph-production-xxxx.up.railway.app`)
6. Click **Deploy**

Your frontend will be live at:
```
https://ralph-xxxx.vercel.app
```

## Step 4: Connect a Custom Domain (optional)

### Buy a domain
- [Namecheap](https://namecheap.com) - ~$10/year
- [Google Domains](https://domains.google) - ~$12/year

### Point it to your app

**For Vercel (frontend):**
1. Go to your Vercel project → Settings → Domains
2. Add your domain (e.g., `app.ralph-coaching.com`)
3. Follow DNS instructions

**For Railway (backend):**
1. Go to your Railway service → Settings → Domains
2. Add custom domain (e.g., `api.ralph-coaching.com`)
3. Follow DNS instructions

## Final Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         INTERNET                               │
└────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌───────────────────┐
        │      Vercel       │   │     Railway       │
        │   (Frontend)      │   │    (Backend)      │
        │                   │   │                   │
        │  app.ralph.com    │──▶│  api.ralph.com    │
        │                   │   │                   │
        │  React Dashboard  │   │  FastAPI + DB     │
        └───────────────────┘   └───────────────────┘
```

## Costs

| Service | Free Tier | Paid |
|---------|-----------|------|
| GitHub | Unlimited public repos | $4/mo for private |
| Railway | 500 hours/month | $5/mo |
| Vercel | 100GB bandwidth | $20/mo |
| Domain | - | ~$12/year |

**Total to start: $0** (using free tiers)
**Production: ~$17/month** + domain

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Make sure `requirements.txt` is in `backend/` folder
- Verify `DATABASE_URL` environment variable

### Frontend can't reach backend
- Check `VITE_API_URL` is set correctly
- Make sure backend URL has `https://`
- Check CORS settings in backend

### Database errors
- Make sure PostgreSQL is provisioned in Railway
- Check `DATABASE_URL` is automatically set

## Next Steps After Deploy

1. **Add authentication** - So users can log in
2. **Connect Garmin** - Auto-sync workouts
3. **Add email notifications** - Daily workout reminders
4. **Mobile app** - React Native version
