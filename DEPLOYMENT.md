# Deployment Guide - Daily Work Log

## Quick Start Deployment Checklist

Follow these steps to deploy your Daily Work Log application to production.

---

## Part 1: Supabase Setup (Backend)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (recommended) or email
4. Create a new organization if needed
5. Click "New Project" and fill in:
   - **Name**: `daily-work-log` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for MVP
6. Click "Create new project" (takes ~2 minutes)

### Step 2: Run Database Migration

1. Once your project is ready, go to the **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `supabase/migrations/001_initial_schema.sql` from this repository
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" (bottom right)
7. You should see "Success. No rows returned"
8. Verify tables created:
   - Go to **Table Editor** (left sidebar)
   - You should see a `logs` table

### Step 3: Configure Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. Ensure **Email** is enabled (should be by default)
3. Optional: Customize email templates
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and password recovery emails

### Step 4: Get API Credentials

1. Go to **Settings** → **API** (left sidebar)
2. Note down these two values:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Keep these safe – you'll need them for deployment

---

## Part 2: Vercel Deployment (Frontend)

### Step 1: Prepare Your Repository

1. Ensure your code is in a Git repository
2. Push to GitHub, GitLab, or Bitbucket:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Daily Work Log MVP"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with the same Git provider you used
3. Click "Add New..." → "Project"
4. **Import your repository**:
   - Select your Daily Work Log repository
   - Click "Import"

5. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

6. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add the following:
   
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |

7. Click "Deploy"
8. Wait 2-3 minutes for deployment to complete
9. Your app will be live at `https://your-project.vercel.app`

### Step 3: Configure Supabase Redirect URLs

1. Copy your Vercel deployment URL (e.g., `https://daily-work-log.vercel.app`)
2. Go back to your **Supabase Dashboard**
3. Navigate to **Authentication** → **URL Configuration**
4. Add these URLs to **Redirect URLs**:
   ```
   https://your-project.vercel.app/**
   https://your-project.vercel.app/auth/callback
   ```
5. Set **Site URL** to:
   ```
   https://your-project.vercel.app
   ```
6. Click "Save"

---

## Part 3: Testing Your Deployment

### Test Checklist

1. ✅ Visit your Vercel URL
2. ✅ Click "Sign up" and create a test account
3. ✅ Check your email for confirmation (if email confirmation enabled)
4. ✅ Log in with your credentials
5. ✅ You should land on the Dashboard
6. ✅ Click "Add Log" and create a test entry
7. ✅ Verify the log appears in the table
8. ✅ Test edit and delete functions
9. ✅ Test search and filters
10. ✅ Test CSV/JSON export

---

## Part 4: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Click "Add"
3. Enter your domain (e.g., `worklog.yourcompany.com`)
4. Follow the DNS configuration instructions
5. Once verified, update Supabase redirect URLs with your custom domain

---

## Monitoring & Maintenance

### Vercel Monitoring

- **Analytics**: Go to your project → Analytics tab
- **Logs**: View function logs in Deployments → Functions
- **Errors**: Check Runtime Logs for any errors

### Supabase Monitoring

- **Database**: Go to Database → Monitor for usage stats
- **Auth**: Go to Authentication → Users to see registered users
- **API**: Go to Settings → API to check usage

### Backups

- Supabase Free tier includes:
  - 7 days of database backups
  - Point-in-time recovery
- Go to **Database** → **Backups** to download manual backups

---

## Scaling Considerations

### When to Upgrade Supabase Plan

- **Free Tier Limits**:
  - 500MB database space
  - 50,000 monthly active users
  - 2GB bandwidth
  - 500MB file storage

- **Upgrade to Pro ($25/month) when**:
  - Approaching database size limit
  - Need more than 7-day backups
  - Require better performance

### When to Upgrade Vercel Plan

- **Hobby Tier (Free)**:
  - 100GB bandwidth/month
  - Unlimited personal projects
  - Great for MVP and personal use

- **Upgrade to Pro ($20/month) when**:
  - Need team collaboration
  - Require more bandwidth
  - Want advanced analytics

---

## Troubleshooting Common Issues

### Issue: "Invalid API key" or "Failed to fetch"

**Solution**:
1. Verify environment variables in Vercel are correct
2. Check for extra spaces or quotes
3. Ensure you're using the `anon public` key, not the `service_role` key
4. Redeploy after changing environment variables

### Issue: "Authentication error" or redirect loops

**Solution**:
1. Check Supabase redirect URLs include your Vercel domain
2. Ensure URLs end with `/**` wildcard
3. Clear browser cookies and try again
4. Check that email provider is enabled in Supabase

### Issue: "Database error" or "Row Level Security policy violation"

**Solution**:
1. Verify SQL migration ran successfully
2. Check RLS policies are enabled on the logs table
3. Ensure user is authenticated before making queries
4. Check browser console for detailed error messages

### Issue: Build fails on Vercel

**Solution**:
1. Check build logs for specific error
2. Verify all dependencies are in package.json
3. Ensure Node.js version compatibility (18+)
4. Try building locally: `npm run build`

---

## Security Best Practices

1. ✅ **Never commit `.env.local`** to Git (already in .gitignore)
2. ✅ **Use environment variables** for all secrets
3. ✅ **Keep RLS enabled** on all tables
4. ✅ **Use anon key on client**, never service_role key
5. ✅ **Enable email verification** for production (in Supabase Auth settings)
6. ✅ **Set up CAPTCHA** if you experience signup abuse
7. ✅ **Rotate API keys** if compromised
8. ✅ **Monitor auth logs** regularly in Supabase

---

## Environment Variables Reference

### Required for Production

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where to Add

- **Vercel**: Project Settings → Environment Variables
- **Local**: `.env.local` file (create from `.env.local.example`)

---

## Post-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database migration executed successfully
- [ ] Tables visible in Supabase Table Editor
- [ ] RLS policies enabled and working
- [ ] Email authentication provider enabled
- [ ] Code pushed to Git repository
- [ ] Vercel project created and linked to repo
- [ ] Environment variables configured in Vercel
- [ ] Successful deployment to Vercel
- [ ] Supabase redirect URLs updated with Vercel domain
- [ ] Tested signup flow
- [ ] Tested login flow
- [ ] Tested creating, editing, deleting logs
- [ ] Tested dashboard charts and stats
- [ ] Tested export functionality
- [ ] Custom domain added (optional)
- [ ] SSL certificate active (automatic with Vercel)

---

## Quick Reference URLs

- **Your Supabase Dashboard**: https://app.supabase.com/project/[your-project-id]
- **Your Vercel Dashboard**: https://vercel.com/[your-username]/[project-name]
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

---

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide first
2. Review Vercel deployment logs
3. Check Supabase logs (Database → Logs)
4. Search [Next.js discussions](https://github.com/vercel/next.js/discussions)
5. Check [Supabase Discord](https://discord.supabase.com)
6. Review the main README.md for technical details

---

**Congratulations! Your Daily Work Log MVP is now live! 🎉**
