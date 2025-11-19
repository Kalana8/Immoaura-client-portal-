# ⚡ QUICK SETUP GUIDE - IMMEDIATE DEPLOYMENT

## 🚀 3-STEP DEPLOYMENT (Works Right After Upload!)

### Step 1: Extract ZIP File
```bash
unzip immoaura-client-portal-hostinger-complete.zip
```

### Step 2: Upload to Hostinger
1. Connect to Hostinger via FTP/SFTP
2. Navigate to **public_html/** directory
3. Upload all extracted files
4. Make sure `.env.production` is uploaded (this has your credentials!)

### Step 3: Rename .env File
After uploading, in Hostinger:
1. Rename `.env.production` to `.env`
2. OR copy `.env.production` and rename the copy to `.env`

**That's it! Your site is ready!**

---

## ✅ EVERYTHING INCLUDED IN ZIP

- ✅ Production build (dist/ folder)
- ✅ **.env.production** with your Supabase credentials
- ✅ .env.example (backup)
- ✅ All source code
- ✅ All translations (4 languages)
- ✅ Configuration files
- ✅ Complete documentation

---

## 🌐 ACCESS YOUR SITE

After uploading:
```
https://your-domain.com
```

The app will load with:
- ✅ Translation system (4 languages working)
- ✅ Messaging system (admin to client)
- ✅ Calendar system (booking)
- ✅ Orders & invoices
- ✅ Authentication
- ✅ All features LIVE

---

## 📋 CREDENTIALS INCLUDED

Your Supabase credentials are pre-configured:
- **Project ID:** tvuklnrtagwivkcznedy
- **URL:** https://tvuklnrtagwivkcznedy.supabase.co
- **Anon Key:** (included in .env.production)

**No additional configuration needed!**

---

## ✨ TEST IMMEDIATELY AFTER UPLOAD

1. **Visit your domain**
   ```
   https://your-domain.com
   ```

2. **Create account or login**
   - Use any email and password

3. **Test language**
   - Click language button (top right)
   - Switch between EN, FR, DE, NL
   - Text changes instantly ✓

4. **Test messaging** (Admin only)
   - Go to Admin Dashboard
   - Click "Send Message" button
   - Send a message to a user

5. **Test calendar** (Client)
   - Go to "New Order"
   - Click "Agenda Selection"
   - See available calendar slots

6. **Test orders**
   - Create a new order
   - Complete the wizard
   - Check order details

7. **Test invoices** (Admin)
   - Create an invoice
   - Upload a PDF
   - Download from client

---

## 🔧 TROUBLESHOOTING

### Issue: White screen
**Solution:**
- Check that `.env` file exists (rename from `.env.production`)
- Clear browser cache (Ctrl+Shift+Del)
- Wait 30 seconds and reload

### Issue: Login not working
**Solution:**
- Check Supabase project is active
- Ensure `.env` has correct credentials
- Check browser console (F12) for errors

### Issue: Language not changing
**Solution:**
- Clear localStorage (browser DevTools)
- Hard refresh (Ctrl+Shift+R)
- Check console for errors

### Issue: Messages not showing
**Solution:**
- Check Supabase messages table exists
- Verify RLS policies enabled
- Refresh page

---

## 📁 FILE STRUCTURE AFTER EXTRACTION

```
extracted-folder/
├── dist/                    → Upload THIS to public_html/
├── src/                     → Source code
├── .env.production         → Rename to .env after upload!
├── .env.example            → Backup
├── package.json            → Dependencies
├── HOSTINGER_README.md     → Full guide
├── QUICK_SETUP_GUIDE.md    → This file
└── Other config files
```

---

## ⚙️ ENVIRONMENT FILE (.env.production)

The `.env.production` file contains:
```
VITE_SUPABASE_URL=https://tvuklnrtagwivkcznedy.supabase.co
VITE_SUPABASE_ANON_KEY=[your-key]
VITE_SUPABASE_PROJECT_ID=tvuklnrtagwivkcznedy
```

**Already configured for you - no changes needed!**

---

## 🎯 FEATURES READY TO USE

### ✅ Translation System
- 4 languages: English, French, German, Dutch
- Real-time switching
- All pages translatable

### ✅ Messaging
- Admin sends messages
- Client inbox
- Real-time notifications

### ✅ Calendar
- Create slots (admin)
- Book slots (client)
- Real-time sync

### ✅ Orders
- Order wizard
- Order tracking
- Contact field

### ✅ Invoices
- Create invoices (admin)
- Upload PDFs
- Download from client

### ✅ Authentication
- Secure login
- Admin/Client roles
- Protected routes

---

## 💡 PRO TIPS

1. **Keep .env Secure**
   - Never share your .env file
   - Don't commit to git
   - Use .env.example for sharing

2. **Test All Features**
   - Language switching
   - Message sending
   - Calendar booking
   - Order creation
   - Invoice upload

3. **Monitor Supabase**
   - Check usage in dashboard
   - Monitor errors
   - Review logs

4. **Regular Backups**
   - Backup database
   - Backup files
   - Document changes

---

## 📞 SUPPORT

### Troubleshooting
- Read HOSTINGER_README.md for detailed guide
- Check HOSTINGER_DEPLOYMENT_CHECKLIST.md for verification
- Review console errors (F12)

### Supabase
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Support: support@supabase.com

### Hostinger
- Dashboard: https://hpanel.hostinger.com
- Support: contact@hostinger.com

---

## ✅ YOU'RE READY!

Everything is configured and ready to go!

1. Extract zip
2. Upload to Hostinger (public_html/)
3. Rename `.env.production` to `.env`
4. Visit your domain
5. **Everything works!** ✓

---

**Status: PRODUCTION READY**
**All credentials configured**
**All features working**
**Ready to deploy immediately!**

🚀 **Happy deploying!**

