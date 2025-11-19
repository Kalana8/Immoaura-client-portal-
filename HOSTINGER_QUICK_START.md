# Quick Start: Deploy to Hostinger in 10 Minutes

## ✅ Pre-Deployment Checklist

- [ ] Node.js 18+ installed on your computer
- [ ] Hostinger hosting account active
- [ ] Supabase project created and configured
- [ ] Resend account (for email notifications)

---

## 🚀 Deployment Steps

### Step 1: Build Locally (2 min)

```bash
cd "/Users/kalanakavinda/Downloads/client portal"

# Install dependencies
npm install

# Create environment file
cat > .env.production << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAIL=admin@yourdomain.com
EOF

# Build for production
npm run build

# Optional: Preview locally
npm run preview
```

### Step 2: Prepare Files (1 min)

**On macOS/Linux:**
```bash
# Create zip with only necessary files
zip -r immoaura-client-portal.zip dist/ supabase/ .htaccess \
  -x "node_modules/*" ".git/*" "src/*" ".env*"
```

**On Windows (PowerShell):**
```powershell
# Use 7-Zip, WinRAR, or File Manager to create zip:
# - Select: dist/ folder, supabase/ folder, .htaccess file
# - Right-click → Send to → Compressed folder
# - Rename to: immoaura-client-portal.zip
```

### Step 3: Upload to Hostinger (3 min)

1. **Log in to Hostinger** hPanel: https://hpanel.hostinger.com
2. **Go to Files → File Manager**
3. **Navigate to public_html**
4. **Click Upload** and select `immoaura-client-portal.zip`
5. **Wait for upload** to complete
6. **Right-click the zip** → **Extract** → **Destination: public_html** → **Extract**
7. **Delete** the `.zip` file after extraction

### Step 4: Configure Hosting (2 min)

1. **Go to Settings → General**
2. **Verify Document Root**: Should be `/public_html`
3. **Enable HTTPS** and HTTP→HTTPS redirect
4. **Go to SSL/Security** and enable **Auto SSL**

### Step 5: Add Supabase Environment Variables (1 min)

**Option 1: In Hostinger Advanced Settings** (if Node.js enabled)
- Variables → Add:
  - `VITE_SUPABASE_URL` = your-project.supabase.co
  - `VITE_SUPABASE_ANON_KEY` = your-key

**Option 2: Hardcode Before Build** (current method)
- Already added to `.env.production`
- Variables bundled into build

### Step 6: Test & Verify (1 min)

1. **Visit your domain**: `https://yourdomain.com`
2. **Check console** (F12 → Console) for errors
3. **Test login** with a test account
4. **Check mobile** responsiveness

---

## 📋 File Structure After Upload

```
public_html/
├── dist/                    ← All compiled React files
│   ├── index.html          ← Main entry point
│   ├── assets/             ← JS, CSS, images
│   ├── favicon.ico
│   └── robots.txt
├── supabase/               ← Database migrations & functions
│   ├── functions/
│   └── migrations/
├── .htaccess               ← Routing & security config
└── immoaura-client-portal.zip  ← DELETE AFTER EXTRACTION
```

---

## 🔐 Environment Variables Needed

**Get from Supabase Dashboard:**
```
Project Settings → API → Copy these:
- Project URL (VITE_SUPABASE_URL)
- anon public key (VITE_SUPABASE_ANON_KEY)
```

**Get from your domain:**
```
VITE_ADMIN_EMAIL = your-admin@yourdomain.com
```

---

## ✨ What's Included

✅ Full React + Vite application  
✅ Responsive mobile-first design  
✅ Order wizard with file uploads  
✅ Dashboard with charts and stats  
✅ Email notifications integration  
✅ Authentication with Supabase  
✅ .htaccess for routing & security  
✅ Optimized production build  

---

## ❌ Common Issues & Fixes

| Issue | Fix |
|---|---|
| **Blank page** | F12 → Console → Check for errors; verify Supabase URL/key |
| **404 on refresh** | Check `.htaccess` exists in public_html |
| **CORS error** | Go to Supabase → Auth → Redirect URLs → Add your domain |
| **No images** | Check image paths in code; verify files exist in dist/assets/ |
| **Emails not sending** | Deploy Supabase function: `supabase functions deploy send-email` |

---

## 📞 Support

- **Hostinger Issues**: https://support.hostinger.com
- **Supabase Issues**: https://supabase.com/docs
- **Deployment Failed?** Check `DEPLOYMENT_GUIDE.md` for detailed steps

---

## 🎉 Success Indicators

After deployment, you should see:
- ✅ Green padlock (HTTPS active)
- ✅ Dashboard loads with data
- ✅ Login/signup works
- ✅ Mobile view responsive
- ✅ Forms submit successfully
- ✅ No console errors

**Total Time: ~15 minutes**

Your Immoaura Client Portal is now live! 🚀
