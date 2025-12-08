# 🚀 Hostinger Upload Instructions

## 📦 Package Ready for Hostinger

**File:** `hostinger-upload-YYYYMMDD-HHMMSS.zip`

This package contains **ONLY** the production build files ready for direct upload to Hostinger.

---

## ✅ What's Included

- ✅ Built production files (`dist` folder contents)
- ✅ `.htaccess` file for proper routing
- ✅ `robots.txt` file
- ✅ All static assets (CSS, JS, images)
- ✅ Optimized and minified code

---

## 📤 Upload Steps to Hostinger

### Method 1: Using Hostinger File Manager

1. **Login to Hostinger**
   - Go to hpanel.hostinger.com
   - Login to your account

2. **Open File Manager**
   - Click on "File Manager" in the control panel
   - Navigate to `public_html` folder

3. **Upload the ZIP file**
   - Click "Upload" button
   - Select `hostinger-upload-YYYYMMDD-HHMMSS.zip`
   - Wait for upload to complete

4. **Extract the ZIP file**
   - Right-click on the uploaded zip file
   - Select "Extract" or "Unzip"
   - Extract to `public_html` folder

5. **Move files to root** (if extracted to subfolder)
   - If files are in a subfolder, move all contents to `public_html` root
   - Ensure `.htaccess` is in the root directory

6. **Set Permissions** (if needed)
   - `.htaccess` should have 644 permissions
   - Folders should have 755 permissions
   - Files should have 644 permissions

### Method 2: Using FTP/SFTP

1. **Extract ZIP file locally**
   ```bash
   unzip hostinger-upload-YYYYMMDD-HHMMSS.zip
   ```

2. **Connect via FTP/SFTP**
   - Use FileZilla or similar FTP client
   - Connect to your Hostinger FTP server
   - Navigate to `public_html` folder

3. **Upload all files**
   - Upload all contents from extracted folder
   - Ensure `.htaccess` is uploaded
   - Maintain folder structure

---

## ⚙️ Post-Upload Configuration

### 1. Verify Environment Variables
Make sure your Supabase environment variables are set in Hostinger:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

**Note:** Since this is a static build, environment variables need to be set at build time. If you need to change them:
1. Update `.env.production` file
2. Rebuild: `npm run build`
3. Create new zip package

### 2. Test the Website
- Visit your domain
- Test all pages load correctly
- Test language switching
- Test wizard functionality
- Test dashboard auto-scroll

### 3. Check Routing
- Test direct URL access (e.g., `/orders`, `/dashboard`)
- If 404 errors occur, verify `.htaccess` is in root directory
- Check `.htaccess` file contents are correct

---

## 🔧 Troubleshooting

### Issue: 404 Errors on Routes
**Solution:**
- Verify `.htaccess` file is in `public_html` root
- Check `.htaccess` permissions (should be 644)
- Ensure Apache mod_rewrite is enabled (usually enabled by default)

### Issue: White/Blank Page
**Solution:**
- Check browser console for errors
- Verify all files uploaded correctly
- Check file permissions
- Verify environment variables are set

### Issue: Assets Not Loading
**Solution:**
- Check file paths in browser console
- Verify all files uploaded to correct location
- Check folder permissions (755 for folders)

### Issue: Translations Not Working
**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Check browser console for JavaScript errors

---

## 📋 Pre-Upload Checklist

- [ ] Build completed successfully (`npm run build`)
- [ ] ZIP file created
- [ ] `.htaccess` file included
- [ ] All assets included
- [ ] Environment variables configured
- [ ] Tested locally

---

## 🧪 Post-Upload Testing Checklist

- [ ] Homepage loads correctly
- [ ] Authentication works
- [ ] Dashboard loads
- [ ] Language switching works (EN, FR, DE, NL)
- [ ] New order wizard works
- [ ] All wizard steps translate correctly
- [ ] Dashboard auto-scrolls to completed orders
- [ ] Orders page loads
- [ ] Order details page loads
- [ ] Invoices page loads
- [ ] Messages page loads
- [ ] Profile page loads

---

## 📞 Support

If you encounter issues:
1. Check Hostinger error logs
2. Check browser console for errors
3. Verify file permissions
4. Check `.htaccess` configuration

---

## 🎉 Ready to Upload!

Your package is ready for Hostinger. Just upload the ZIP file and extract it to `public_html`!

**File to upload:** `hostinger-upload-YYYYMMDD-HHMMSS.zip`

