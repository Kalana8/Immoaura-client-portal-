# 🚀 Immoaura Client Portal - Setup Instructions

## 📦 Package Contents

This deployment package includes:

1. **dist/** - Production-ready build (upload to `public_html/`)
2. **.htaccess** - SPA routing configuration
3. **supabase/migrations/** - Database migration files
4. **Configuration files** - For reference/rebuilding

---

## ⚡ Quick Deployment (5 Steps)

### Step 1: Upload Files

**Via Hostinger File Manager:**
1. Log in to Hostinger hPanel
2. Go to **File Manager**
3. Navigate to `public_html/`
4. Upload **ALL contents** from `dist/` folder
5. Upload `.htaccess` file to `public_html/` root

**Via FTP:**
1. Connect via FTP/SFTP
2. Navigate to `public_html/`
3. Upload all files from `dist/` folder
4. Upload `.htaccess` file

### Step 2: Verify Supabase Configuration

The build includes Supabase credentials. **Check if they're correct:**

1. Open `dist/assets/index-*.js` in a text editor
2. Search for: `https://tvuklnrtagwivkcznedy.supabase.co`
3. If this is NOT your Supabase URL, you need to update it (see Step 3)

### Step 3: Update Supabase Credentials (If Needed)

**Option A: Quick Edit (Recommended for quick deployment)**
1. Download `dist/assets/index-*.js` from Hostinger
2. Open in text editor
3. Find and replace:
   - Old URL: `https://tvuklnrtagwivkcznedy.supabase.co`
   - New URL: `https://your-project.supabase.co`
   - Old Key: Find the long JWT token
   - New Key: Replace with your anon key
4. Re-upload the file

**Option B: Rebuild (Recommended for production)**
1. Create `.env.production`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
2. Run: `npm install && npm run build`
3. Upload new `dist/` folder

### Step 4: Run Database Migrations

1. Go to **Supabase Dashboard → SQL Editor**
2. Run migrations in this exact order:
   ```
   1. 20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql
   2. 20251022050000_fix_users_rls.sql
   3. 20251023000000_create_order_number_function.sql
   4. 20251101192740_fix_order_number_sequence.sql
   5. 20251102000000_create_admin_infrastructure.sql
   6. 20251102050000_phase6_email_notifications.sql
   7. 20251103000000_setup_file_storage.sql
   ```

### Step 5: Configure Supabase Redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Add to **Redirect URLs**:
   - `https://yourdomain.com`
   - `https://yourdomain.com/auth`
   - `https://yourdomain.com/dashboard`
   - `https://yourdomain.com/reset-password`
3. Set **Site URL** to: `https://yourdomain.com`

---

## 🧪 Testing

After deployment, test these features:

### Basic Functionality
- [ ] Welcome page loads
- [ ] Sign up works
- [ ] Login works
- [ ] Forgot password works
- [ ] Password reset works

### Client Features
- [ ] Dashboard loads
- [ ] Orders list shows
- [ ] Create new order works
- [ ] Calendar booking works
- [ ] Messages work
- [ ] Invoices show
- [ ] Language switching works (EN, FR, DE, NL)

### Admin Features
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] Calendar management works
- [ ] Order management works
- [ ] Invoice creation works
- [ ] Message sending works

---

## 🔧 Troubleshooting

### White/Blank Page
**Check:**
1. Browser console (F12 → Console)
2. Supabase URL and key are correct
3. `.htaccess` file exists in `public_html/`
4. File permissions (644 for files, 755 for folders)

### 404 Errors on Refresh
**Fix:**
1. Ensure `.htaccess` is in `public_html/` root
2. Check `mod_rewrite` is enabled in Hostinger
3. Verify `.htaccess` content is correct

### CORS Errors
**Fix:**
1. Add domain to Supabase redirect URLs
2. Check Supabase project settings
3. Verify API keys are correct

### Login Not Working
**Check:**
1. Supabase project is active
2. Authentication is enabled
3. RLS policies are configured
4. Browser console for specific errors

---

## 📞 Support

- **Supabase:** https://app.supabase.com
- **Hostinger:** https://hpanel.hostinger.com
- **Documentation:** See DEPLOYMENT_README.md

---

## ✅ Deployment Checklist

Before going live:
- [x] Files uploaded to `public_html/`
- [x] `.htaccess` in place
- [x] Supabase credentials configured
- [x] Database migrations run
- [x] Redirect URLs configured
- [x] SSL certificate active
- [x] All features tested
- [x] Browser console checked (no errors)

---

**Status:** ✅ Ready for Deployment
**Version:** 1.0.0
**Date:** November 2025

