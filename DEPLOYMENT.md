# Deployment Guide

## Quick Deployment Checklist

### 1. Prepare GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Red Bull Supply Chain Platform"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/red-bull-supply-chain.git
git branch -M main
git push -u origin main
```

### 2. Deploy Database (Neon - Free Tier)

1. Go to https://neon.tech
2. Sign up / Log in
3. Click "Create Project"
4. Name: `red-bull-supply-chain`
5. Region: Choose closest to your users
6. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)
7. Save it for later

### 3. Deploy Backend (Railway - Free Tier)

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Click "Add variables" and add:
   ```
   DATABASE_URL=your-neon-connection-string
   JWT_SECRET=your-random-secret-key-min-32-chars
   PORT=3000
   NODE_ENV=production
   ```
6. In Settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
7. Click "Deploy"
8. After deployment, run migrations:
   - Go to project → Click on service
   - Open "Settings" → "Deploy"
   - Add "Deploy Command": `npx prisma migrate deploy && npm run seed`
9. Copy the public URL (e.g., `https://your-app.up.railway.app`)

### 4. Deploy Frontend (Vercel - Free Tier)

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: Your Railway backend URL (e.g., `https://your-app.up.railway.app`)
7. Click "Deploy"
8. Wait for deployment (2-3 minutes)
9. Your app will be live at: `https://your-project.vercel.app`

### 5. Test Your Deployment

1. Visit your Vercel URL
2. Login with: `admin` / `admin123`
3. Test all features:
   - Cost Calculator
   - Route Optimizer
   - Map visualization
   - Analytics Dashboard

## Alternative Backend Deployment Options

### Option A: Render (Free Tier)

1. Go to https://render.com
2. Sign up / Log in
3. Click "New" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - Name: `red-bull-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
6. Add Environment Variables (same as Railway)
7. Click "Create Web Service"
8. After deployment, go to "Shell" tab and run:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

### Option B: Heroku (Paid - $5/month minimum)

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
cd backend
heroku create red-bull-supply-chain

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix backend heroku main

# Run migrations
heroku run npx prisma migrate deploy
heroku run npm run seed

# Get backend URL
heroku info
```

## Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
PORT=3000
NODE_ENV=production
REDIS_URL="redis://..." # Optional
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com
```

## Post-Deployment Steps

### 1. Update CORS Settings

In `backend/src/index.ts`, update CORS origin:
```typescript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

### 2. Seed Database (if not done automatically)

```bash
# Railway: Use the web terminal
npx prisma migrate deploy
npm run seed

# Or connect directly
DATABASE_URL="your-connection-string" npx prisma migrate deploy
DATABASE_URL="your-connection-string" npm run seed
```

### 3. Test API Endpoints

```bash
# Health check
curl https://your-backend-url.com/health

# Login
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Troubleshooting

### Frontend can't connect to backend
- Check VITE_API_URL is correct
- Verify CORS settings in backend
- Check browser console for errors

### Database connection errors
- Verify DATABASE_URL is correct
- Check if Neon database is active
- Ensure IP whitelist allows connections (Neon: allow all)

### Build failures
- Check Node.js version (18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Prisma errors
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate deploy` for production
- Never use `migrate dev` in production

## Monitoring & Logs

### Railway
- Dashboard → Your Service → Logs tab
- Real-time log streaming

### Vercel
- Dashboard → Your Project → Deployments → View Function Logs

### Render
- Dashboard → Your Service → Logs tab

## Custom Domain (Optional)

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Railway (Backend)
1. Go to Service Settings → Networking
2. Add custom domain
3. Update DNS records

## Cost Estimate

- **Neon Database**: Free (0.5GB storage, 100 hours compute/month)
- **Railway Backend**: Free ($5 credit/month, ~500 hours)
- **Vercel Frontend**: Free (100GB bandwidth, unlimited deployments)

**Total: $0/month** for demo purposes

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS only
- [ ] Set proper CORS origins
- [ ] Add rate limiting
- [ ] Enable Vercel password protection (optional)
- [ ] Review Neon IP whitelist settings

## Demo Preparation

1. **Create demo account**: Add a demo user with limited permissions
2. **Prepare data**: Ensure database has realistic data
3. **Test all features**: Go through each page and feature
4. **Check mobile**: Test on mobile devices
5. **Prepare talking points**: Know your features and tech stack
6. **Monitor performance**: Check load times and responsiveness

## Support

For deployment issues:
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Neon: https://neon.tech/docs
- Render: https://render.com/docs

---

Good luck with your demo! 🚀
