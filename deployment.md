# EBMS Vercel Deployment Guide

Follow these steps to deploy the E-Book Management System (EBMS) frontend and backend onto Vercel.

---

## ⚠️ CRITICAL SECURITY WARNING: ROTATE YOUR KEYS!
Because the `.env` files were previously committed and tracked in your git history, **they are compromised if your git repository is public**. Before deploying, please rotate the following credentials:
1. **MongoDB Connection String Password** (generate a new database user/password in Atlas).
2. **Supabase API Keys** (specifically `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`).
3. **Cloudinary API Secret** (generate a new secret in your Cloudinary console).

---

## Step 1: Push Changes to Git
Now that the `.env` files are untracked and added to `.gitignore`, commit and push the project changes to your GitHub / GitLab repository:
```bash
git add .
git commit -m "Configure Vercel deployment and secure env files"
git push origin main
```
*Note: Make sure `.env` files are not listed in `git status` before committing.*

---

## Step 2: Deploy Frontend on Vercel

1. Go to the **[Vercel Dashboard](https://vercel.com/dashboard)** and click **Add New** → **Project**.
2. Import your EBMS repository.
3. Under **Configure Project**:
   - **Project Name**: `ebms-frontend` (or your choice)
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Expand **Build and Development Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add the following keys:
   - `VITE_API_URL`: The URL of your deployed backend API (e.g., `https://ebms-backend.vercel.app/api`)
   - `VITE_SUPABASE_URL`: Your Supabase Project URL (e.g., `https://muprpucgquqsgdqxyjwf.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
6. Click **Deploy**.

---

## Step 3: Deploy Backend on Vercel

1. Go to the **Vercel Dashboard** and click **Add New** → **Project**.
2. Import the *same* EBMS repository.
3. Under **Configure Project**:
   - **Project Name**: `ebms-backend` (or your choice)
   - **Framework Preset**: `Other` (or leave as default)
   - **Root Directory**: `backend`
4. Expand **Environment Variables** and add the following keys:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default, Vercel will map it automatically)
   - `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb+srv://...`)
   - `SUPABASE_URL`: `https://muprpucgquqsgdqxyjwf.supabase.co`
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API Key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret
   - `CLIENT_URL`: The URL of your deployed frontend (e.g., `https://ebms-frontend.vercel.app`)
5. Click **Deploy**.

---

## Troubleshooting & Notes
- **Serverless Limits**: Vercel Serverless Functions have a execution timeout limit (10s on Free tier). If any API routes involve heavy data seeding/migration, run them locally first before deploying.
- **Continuous Cron Jobs**: Background cron jobs (`cronJobs.js`) are disabled automatically when running in Vercel to prevent memory/performance issues. If you need automated background jobs, set up **Vercel Cron Jobs** pointing to a secure API endpoint in your backend.
- **CORS Issues**: If the frontend cannot communicate with the backend, double-check that the `CLIENT_URL` environment variable on the backend project exactly matches the protocol and domain of your deployed frontend (without trailing slash).
