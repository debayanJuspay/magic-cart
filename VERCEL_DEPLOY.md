# Deploy to Vercel

This guide walks you through deploying the Cart Drawer app to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free)
- [GitHub account](https://github.com)
- [Shopify Partner account](https://partners.shopify.com)

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cart-drawer-app.git
git push -u origin main
```

## Step 2: Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** tab
3. Click **Create Database** → **Postgres**
4. Choose region (recommended: `us-east-1` for best performance with Shopify)
5. Click **Create**

Wait for the database to be created (~1 minute).

## Step 3: Connect Database to Project

1. In your database page, click **Connect Project**
2. Select or create a new project
3. Click **Connect**

This automatically sets the `DATABASE_URL` environment variable.

## Step 4: Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Remix`
   - **Root Directory**: `./`
   - **Build Command**: `npm run vercel-build`
5. Add environment variables (see below)
6. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts to link to existing project or create new
```

## Step 5: Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

| Name | Value | Where to Get |
|------|-------|--------------|
| `SHOPIFY_API_KEY` | `xxxxxxxxxx` | Partner Dashboard → App → Client ID |
| `SHOPIFY_API_SECRET` | `xxxxxxxxxx` | Partner Dashboard → App → Client Secret |
| `SCOPES` | `read_products,write_products,read_orders,write_discounts,read_inventory` | As shown |
| `SHOPIFY_APP_URL` | `https://your-project.vercel.app` | Your Vercel deployment URL |
| `DATABASE_URL` | (auto-filled) | Already set by Vercel Postgres |

**Important**: After adding env vars, redeploy:
```bash
vercel --prod
```

Or in Dashboard: click **Redeploy** on latest deployment.

## Step 6: Configure Shopify App URLs

In [Shopify Partner Dashboard](https://partners.shopify.com):

### App URL
```
https://your-project.vercel.app
```

### Allowed Redirection URL(s)
```
https://your-project.vercel.app/auth/callback
https://your-project.vercel.app/auth/shopify/callback
https://your-project.vercel.app/api/auth/callback
```

### Configuration → Admin API Access Scopes
Add these scopes:
- `read_products`
- `write_products`
- `read_orders`
- `write_discounts`
- `read_inventory`

Click **Save**.

## Step 7: Run Database Migrations

After first deploy, run migrations:

### Option A: Vercel CLI
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

### Option B: Vercel Console (Recommended)
1. Go to Vercel Dashboard → Your Project
2. Click **Console** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

## Step 8: Install on Store

1. Visit your app's install URL:
   ```
   https://admin.shopify.com/store/YOUR_STORE_NAME/apps/YOUR_APP_HANDLE
   ```

2. Or use the Vercel URL with install path:
   ```
   https://your-project.vercel.app/app?shop=your-store.myshopify.com
   ```

## Updating Your App

After making code changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel automatically redeploys on every push to `main`.

## Custom Domain (Optional)

1. Vercel Dashboard → Project Settings → Domains
2. Add your domain
3. Update `SHOPIFY_APP_URL` and redirect URLs in Shopify Partner Dashboard
4. Redeploy

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is set correctly
- Ensure Vercel Postgres is in the same region as your function

### "Authentication failed"
- Check `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` match Partner Dashboard
- Verify redirect URLs include your Vercel domain exactly

### "App won't load in Shopify Admin"
- Ensure CSP headers allow Shopify domains (configured in `entry.server.tsx`)
- Check `X-Frame-Options` is set to `ALLOWALL`

### Database migrations not running
- Run `npx prisma migrate deploy` manually in Vercel Console
- Or add to build command: `"prisma migrate deploy && remix build"`

## Monitoring

View logs:
- Vercel Dashboard → Your Project → **Logs**
- Or CLI: `vercel logs your-project --json`

## Performance Tips

1. **Enable Edge Functions** (for API routes):
   ```javascript
   export const config = {
     runtime: 'edge',
   };
   ```

2. **Database Connection Pooling**:
   Vercel Postgres includes connection pooling automatically.

3. **Caching**:
   Add cache headers for static assets and API responses.

## Cost Estimate

| Tier | Monthly Cost | Limits |
|------|-------------|--------|
| Vercel Hobby (Free) | $0 | 100GB bandwidth, 10s serverless function timeout |
| Vercel Pro | $20 | 1TB bandwidth, 5min timeout |
| Vercel Postgres | $0 | 256MB storage (dev), scales with usage |

For most Shopify apps, the free tier is sufficient to start.
