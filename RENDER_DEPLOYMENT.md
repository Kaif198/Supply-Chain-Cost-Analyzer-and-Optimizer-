# Render Deployment Guide - Red Bull Supply Chain Platform

## Step-by-Step Render Deployment

### Prerequisites
- GitHub account
- Neon database account (free)
- Render account (free)

---

## Part 1: Setup Database (Neon - 5 minutes)

1. Go to https://neon.tech
2. Sign up / Log in with GitHub
3. Click **"Create Project"**
4. Configure:
   - Name: `red-bull-supply-chain`
   - Region: `Europe (Frankfurt)` or closest to you
   - PostgreSQL version: Latest
5. Click **"Create Project"**
6. Copy the connection string from the dashboard
   - Format: `postgresql://user:password@host/dbname?sslmode=require`
7. **Save this connection string** - you'll need it for Render

---

## Part 2: Deploy Backend on Render (10 minutes)

### Step 1: Create Web Service

1. Go to https://render.com
2. Sign up / Log in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect account"** to connect GitHub
5. Find and select your repository: `red-bull-supply-chain`
6. Click **"Connect"**

### Step 2: Configure Service

Fill in the following:

**Basic Settings:**
- **Name**: `red-bull-backend` (or your preferred name)
- **Region**: `Frankfurt (EU Central)` (closest to Neon)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: 
  ```
  npm install && npx prisma generate && npm run build
  ```
- **Start Command**: 
  ```
  npm start
  ```

### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

1. **DATABASE_URL**
   - Value: Your Neon connection string (from Part 1)
   - Example: `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/dbname?sslmode=require`

2. **JWT_SECRET**
   - Value: Generate a random 32+ character string
   - Example: `your-super-secret-jwt-key-change-this-in-production-32chars`
   - Or generate one: https://randomkeygen.com/

3. **NODE_ENV**
   - Value: `production`

4. **PORT**
   - Value: `3000`

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Watch the logs for any errors
4. Once deployed, you'll see: **"Your service is live 🎉"**

### Step 5: Run Database Migrations

After deployment succeeds:

1. In your Render dashboard, click on your service
2. Go to **"Shell"** tab (left sidebar)
3. Run these commands one by one:

```bash
npx prisma migrate deploy
```

```bash
npm run seed
```

4. You should see: "✅ Database seeded successfully"

### Step 6: Get Your Backend URL

1. At the top of your Render dashboard, you'll see your service URL
2. Format: `https://red-bull-backend.onrender.com`
3. **Copy this URL** - you'll need it for frontend deployment

### Step 7: Test Your Backend

Open in browser or use curl:

```bash
# Health check
https://your-backend-url.onrender.com/health

# Should return: {"status":"ok"}
```

---

## Part 3: Deploy Frontend on Vercel (5 minutes)

### Step 1: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Add Environment Variable

Click **"Environment Variables"**:

- **Name**: `VITE_API_URL`
- **Value**: Your Render backend URL (from Part 2, Step 6)
  - Example: `https://red-bull-backend.onrender.com`

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app will be live at: `https://your-project.vercel.app`

---

## Part 4: Final Configuration

### Update CORS in Backend

After getting your Vercel URL, update CORS settings:

1. Go to your GitHub repository
2. Edit `backend/src/index.ts`
3. Find the CORS configuration:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-vercel-app.vercel.app'  // Add your Vercel URL here
  ],
  credentials: true
}));
```

4. Commit and push
5. Render will auto-deploy the update

---

## Testing Your Deployment

### 1. Test Backend API

```bash
curl https://your-backend-url.onrender.com/api/premises
```

### 2. Test Frontend

1. Visit: `https://your-vercel-app.vercel.app`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Test features:
   - Cost Calculator
   - Route Optimizer
   - Map visualization
   - Analytics Dashboard

---

## Troubleshooting

### Backend Issues

**Problem**: Build fails
- Check Node version in Render (should be 18+)
- Verify `package.json` has all dependencies
- Check build logs for specific errors

**Problem**: Database connection fails
- Verify DATABASE_URL is correct
- Check Neon database is active
- Ensure connection string includes `?sslmode=require`

**Problem**: Migrations fail
- Run migrations manually in Shell tab
- Check Prisma schema is valid
- Verify database permissions

### Frontend Issues

**Problem**: Can't connect to backend
- Verify VITE_API_URL is correct (no trailing slash)
- Check CORS settings in backend
- Open browser console for errors

**Problem**: Build fails
- Check Node version
- Verify all dependencies are installed
- Check Vite config

### Render-Specific Issues

**Problem**: Service keeps restarting
- Check logs for errors
- Verify start command is correct
- Check environment variables

**Problem**: Slow cold starts
- Free tier sleeps after 15 min inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier for production

---

## Render Free Tier Limits

- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ 512 MB RAM
- ⚠️ Shared CPU

---

## Cost Summary

- **Neon Database**: FREE (0.5GB storage, 100 hours compute/month)
- **Render Backend**: FREE (750 hours/month)
- **Vercel Frontend**: FREE (100GB bandwidth)

**Total: $0/month** 🎉

---

## Next Steps

1. ✅ Backend deployed on Render
2. ✅ Frontend deployed on Vercel
3. ✅ Database on Neon
4. 🔄 Update CORS settings
5. 🔄 Test all features
6. 🔄 Prepare demo

---

## Monitoring

### Render Dashboard
- View logs: Dashboard → Your Service → Logs
- Monitor metrics: Dashboard → Your Service → Metrics
- Shell access: Dashboard → Your Service → Shell

### Vercel Dashboard
- View deployments: Dashboard → Your Project → Deployments
- Check analytics: Dashboard → Your Project → Analytics
- View logs: Click on deployment → View Function Logs

---

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Neon Docs: https://neon.tech/docs
- Vercel Docs: https://vercel.com/docs

---

**Your app is now live! 🚀**

Share your demo URL: `https://your-project.vercel.app`
