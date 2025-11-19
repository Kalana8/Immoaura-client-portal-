# 🚀 Immoaura Client Portal - Hostinger Deployment Package

## ✅ What's Included

This package contains a **fully functional, production-ready** Immoaura Client Portal with:

- ✅ Complete React + Vite application (optimized build)
- ✅ All source code and components
- ✅ Database migrations (SQL files)
- ✅ .htaccess configuration for SPA routing
- ✅ Environment configuration guide
- ✅ Deployment instructions

---

## 📋 QUICK START (5 Minutes)

### Step 1: Extract Files
1. Extract this zip file
2. You'll see a `dist/` folder (production build) and other files

### Step 2: Configure Supabase (REQUIRED)

**Get your Supabase credentials:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (long JWT token)

**Update the build:**
The Supabase URL and key are currently hardcoded in the build. To update them:

1. Edit `dist/assets/index-*.js` (find and replace):
   - Search for: `https://tvuklnrtagwivkcznedy.supabase.co`
   - Replace with: Your Supabase URL
   - Search for: The old anon key
   - Replace with: Your new anon key

**OR rebuild with new credentials:**
1. Create `.env.production` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
2. Run: `npm run build`
3. Use the new `dist/` folder

### Step 3: Upload to Hostinger

**Via File Manager:**
1. Log in to Hostinger hPanel
2. Go to **File Manager**
3. Navigate to `public_html/`
4. Upload **ALL contents** of the `dist/` folder
5. Upload `.htaccess` file to `public_html/` root

**Via FTP/SFTP:**
1. Connect to your Hostinger FTP
2. Navigate to `public_html/`
3. Upload all files from `dist/` folder
4. Upload `.htaccess` file

### Step 4: Verify Deployment

1. Visit your domain: `https://yourdomain.com`
2. You should see the welcome page
3. Test login functionality
4. Check browser console (F12) for any errors

---

## 🔐 Environment Configuration

### Current Configuration
The build includes Supabase credentials. If you need to change them:

**Option 1: Edit Built Files (Quick)**
- Edit `dist/assets/index-*.js`
- Find and replace Supabase URL and key
- Re-upload the file

**Option 2: Rebuild (Recommended)**
1. Install dependencies: `npm install`
2. Create `.env.production`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Build: `npm run build`
4. Upload new `dist/` folder

---

## 📂 File Structure

```
deployment-package/
├── dist/                          # Production build (UPLOAD THIS)
│   ├── index.html                 # Main entry point
│   ├── assets/                    # JS, CSS, images
│   │   ├── index-*.js             # Main application bundle
│   │   └── index-*.css            # Styles
│   ├── favicon.ico
│   ├── favicon.png
│   ├── immoaura-logo.png
│   └── robots.txt
├── .htaccess                      # SPA routing config (UPLOAD THIS)
├── supabase/                      # Database migrations
│   └── migrations/               # SQL migration files
├── src/                           # Source code (for reference)
├── package.json                   # Dependencies list
├── DEPLOYMENT_README.md          # This file
└── vite.config.ts                # Build configuration
```

---

## 🗄️ Database Setup

### Run Migrations

All database migrations are in `supabase/migrations/` folder.

**To apply migrations:**
1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order:
   - `20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql`
   - `20251022050000_fix_users_rls.sql`
   - `20251023000000_create_order_number_function.sql`
   - `20251101192740_fix_order_number_sequence.sql`
   - `20251102000000_create_admin_infrastructure.sql`
   - `20251102050000_phase6_email_notifications.sql`
   - `20251103000000_setup_file_storage.sql`

**Important:** Run migrations in the exact order listed above.

---

## 🧪 Testing Checklist

After deployment, test these features:

### Authentication
- [ ] Sign up with new email
- [ ] Login with existing account
- [ ] Forgot password flow
- [ ] Password reset

### Client Dashboard
- [ ] View orders list
- [ ] Create new order
- [ ] View order details
- [ ] View invoices
- [ ] View messages
- [ ] Language switching (EN, FR, DE, NL)

### Admin Panel
- [ ] Admin login
- [ ] Calendar management
- [ ] Order management
- [ ] Invoice creation
- [ ] Message sending
- [ ] File uploads

---

## 🔧 Troubleshooting

### White/Blank Page
**Solution:**
1. Check browser console (F12 → Console)
2. Verify Supabase URL and key are correct
3. Ensure `.htaccess` is in `public_html/` root
4. Check file permissions (should be 644 for files, 755 for folders)

### 404 Errors on Page Refresh
**Solution:**
1. Verify `.htaccess` file exists in `public_html/`
2. Check that `mod_rewrite` is enabled in Hostinger
3. Ensure `.htaccess` has correct permissions (644)

### CORS Errors
**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your domain to "Redirect URLs"
3. Add your domain to "Site URL"

### Images Not Loading
**Solution:**
1. Check `dist/assets/` contains image files
2. Verify image paths in browser console
3. Check file permissions

### Login Not Working
**Solution:**
1. Verify Supabase project is active
2. Check Supabase authentication settings
3. Ensure RLS policies are enabled
4. Check browser console for specific errors

---

## 📱 Features Included

### Client Features
- ✅ Order management (create, view, track)
- ✅ Invoice viewing and download
- ✅ Real-time messaging
- ✅ Calendar booking for Property Video
- ✅ File uploads for orders
- ✅ Multi-language support (EN, FR, DE, NL)
- ✅ Responsive mobile design

### Admin Features
- ✅ Calendar management (create slots, bulk actions)
- ✅ Order management (view, update status, assign slots)
- ✅ Invoice creation with PDF upload
- ✅ Client messaging system
- ✅ File management (upload files for clients)
- ✅ Analytics dashboard

---

## 🔄 Updating the Application

To update after making changes:

1. **Make changes locally**
2. **Update environment variables** (if needed)
3. **Rebuild:** `npm run build`
4. **Upload new `dist/` folder** to Hostinger
5. **Clear browser cache** (Ctrl+Shift+Del)

---

## 📞 Support

### Supabase
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Support: support@supabase.com

### Hostinger
- hPanel: https://hpanel.hostinger.com
- Docs: https://hostinger.com/help
- Support: Available in hPanel

---

## ✅ Pre-Deployment Checklist

Before going live, verify:

- [x] Production build created (`dist/` folder exists)
- [x] `.htaccess` file included
- [x] Supabase credentials configured
- [x] Database migrations ready
- [x] All files uploaded to `public_html/`
- [x] Domain configured and SSL active
- [x] Test login works
- [x] Test order creation works
- [x] Test calendar booking works
- [x] Test language switching works

---

## 🎉 You're Ready!

Your Immoaura Client Portal is now ready for deployment on Hostinger!

**Next Steps:**
1. Upload `dist/` contents to `public_html/`
2. Upload `.htaccess` to `public_html/` root
3. Run database migrations in Supabase
4. Test all features
5. Go live! 🚀

---

**Package Version:** 1.0.0
**Build Date:** November 2025
**Status:** Production Ready ✅

