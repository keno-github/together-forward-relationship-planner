# 🟦 Supabase Setup Guide for TogetherForward

## Step 1: Create Supabase Account (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. You'll land on your dashboard

---

## Step 2: Create New Project (2 minutes)

1. Click **"New Project"**
2. Fill in:
   - **Name:** `TogetherForward`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you (e.g., US East, Europe West)
   - **Pricing Plan:** Select **Free** (perfect for getting started)
3. Click **"Create new project"**
4. Wait 1-2 minutes while Supabase sets up your database

---

## Step 3: Get Your API Keys (1 minute)

1. Once project is created, go to **Settings** (gear icon on left sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:

   **Project URL:**
   ```
   https://abcdefghijklmno.supabase.co
   ```

   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

4. Copy both values!

---

## Step 4: Add Keys to Your .env File (1 minute)

1. Open `C:\Users\omogh\together-forward\.env`
2. Replace the placeholder values:

   **Before:**
   ```
   REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
   REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
   ```

   **After:**
   ```
   REACT_APP_SUPABASE_URL=https://abcdefghijklmno.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

3. Save the file
4. **IMPORTANT:** Restart your React app:
   ```bash
   # Stop the current server (Ctrl+C)
   npm start
   ```

---

## Step 5: Set Up Database Schema (3 minutes)

1. In Supabase dashboard, click **SQL Editor** (icon on left sidebar)
2. Click **"New query"**
3. Open the file `supabase_schema.sql` in your project folder
4. **Copy ALL the SQL code** from that file
5. **Paste** it into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: ✅ **"Success. No rows returned"**

**What this does:**
- Creates 7 tables: profiles, roadmaps, milestones, tasks, achievements, conversation_history
- Sets up Row Level Security (RLS) so users only see their own data
- Creates automatic triggers for timestamps
- Sets up indexes for fast queries

---

## Step 6: Enable Authentication Providers (2 minutes)

### Enable Email Authentication:
1. Go to **Authentication** → **Providers** (left sidebar)
2. Find **Email** provider
3. Toggle it **ON**
4. Click **Save**

### Enable Google Authentication (Optional but Recommended):
1. In the same **Providers** section, find **Google**
2. Click **Enable**
3. You'll need:
   - Google Client ID
   - Google Client Secret

**To get Google credentials:**
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a project → Enable Google+ API
- Create OAuth 2.0 credentials
- Copy Client ID and Secret
- Paste into Supabase

**For now, you can skip Google and use email only!**

---

## Step 7: Set Up Storage for Files (Optional - 2 minutes)

If you want users to upload files (venue contracts, photos):

1. Go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Name it: `roadmap-files`
4. Set **Public bucket:** OFF (for privacy)
5. Click **Save**
6. Go to **Policies** → Add policy:
   ```sql
   -- Allow users to upload their own files
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'roadmap-files' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

---

## Step 8: Test Your Setup (2 minutes)

1. Make sure your `.env` file has the correct keys
2. Restart your React app if it's running
3. Open the browser console (F12)
4. You should NOT see any Supabase warnings
5. If configured correctly, you'll see: ✅ No errors

**Test authentication:**
- Your app should now have login/signup functionality
- Try creating an account
- Check **Authentication** → **Users** in Supabase dashboard
- You should see your new user!

---

## 🎉 You're Done!

### What You Now Have:

✅ **Cloud database** - Data persists forever
✅ **User authentication** - Login with email/Google
✅ **Real-time sync** - Changes sync across devices
✅ **Row Level Security** - Users only see their data
✅ **Automatic backups** - Supabase backs up daily
✅ **Free tier** - 500MB database, 1GB storage

---

## 📊 Supabase Dashboard Overview:

**Key sections you'll use:**

1. **Table Editor:** View/edit your data (like Excel)
2. **SQL Editor:** Run custom queries
3. **Authentication:** See registered users
4. **Storage:** Manage uploaded files
5. **Database → Logs:** See all queries (for debugging)

---

## 🐛 Troubleshooting:

### "Supabase not configured" warning?
- Check `.env` file has correct URL and key
- Make sure you restarted React app after changing `.env`
- Keys must start with `REACT_APP_`

### "Failed to fetch" errors?
- Check your internet connection
- Verify Supabase project is still active (not paused)
- Check Supabase Status: [status.supabase.com](https://status.supabase.com)

### Can't sign up new users?
- Go to **Authentication** → **Providers**
- Make sure **Email** is enabled
- Check **Authentication** → **Settings** → **Email Auth** is ON

### Database queries failing?
- Go to **Database** → **Logs**
- Check for error messages
- Verify RLS policies are correct

---

## 🚀 Next Steps:

Now that Supabase is set up, the app will:
- ✅ Save all data to cloud
- ✅ Allow user login/signup
- ✅ Sync between devices
- ✅ Share roadmaps with partners
- ✅ Never lose data (even if browser cache clears)

Your app is now **production-ready**! 🎊

---

## 💰 Free Tier Limits:

- **Database:** 500MB (enough for ~10,000 users)
- **Storage:** 1GB (thousands of images)
- **Bandwidth:** 2GB/month
- **Users:** Unlimited!

**When you exceed:**
- Supabase will email you
- Upgrade to Pro for $25/month
- You'll likely have 5,000+ active users by then!

---

## 📚 Useful Links:

- [Supabase Docs](https://supabase.com/docs)
- [React + Supabase Tutorial](https://supabase.com/docs/guides/with-react)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Discord](https://discord.supabase.com) - Get help from community

---

**Questions? Check the Supabase docs or ask me!** 💬
