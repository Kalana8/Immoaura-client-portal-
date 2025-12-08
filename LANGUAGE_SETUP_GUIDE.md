
# 🌐 Multi-Language Support Implementation Guide

## Overview

Your Immoaura Client Portal and Admin Dashboard now have full multi-language support using DeepL API. Users will see a language selection modal on first visit and can switch languages anytime.

**Supported Languages:**
- 🇳🇱 Dutch (NL) - Nederlands
- 🇫🇷 French (FR) - Français
- 🇩🇪 German (DE) - Deutsch
- 🇬🇧 English (EN) - English

---

## Architecture

### Components Created

1. **LanguageContext** (`src/contexts/LanguageContext.tsx`)
   - Global state management for language
   - Handles translation requests to DeepL API
   - Persists language preference to localStorage

2. **LanguageSelector** (`src/components/LanguageSelector.tsx`)
   - Modal that appears on first dashboard visit
   - Beautiful UI with flag emojis
   - Allows user to select preferred language

3. **LanguageSwitcher** (`src/components/LanguageSwitcher.tsx`)
   - Compact switcher component for sidebar
   - Quick language toggle in settings

---

## Setup Instructions

### Step 1: Backend Setup (Hosting - Hostinger)

Create a new file on your Hostinger hosting:

**Path:** `public_html/api/translate.php`

**Copy this code:**

```php
<?php

// Simple DeepL proxy for shared hosting (e.g., Hostinger)
// Configure your API key via hosting env variable DEEPL_API_KEY

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload) || !isset($payload['text']) || !isset($payload['target_lang'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid payload']);
  exit;
}

$apiKey = getenv('DEEPL_API_KEY');
if (!$apiKey) {
  // TEMP fallback if env vars aren't available on your plan
  $apiKey = 'YOUR_DEEPL_API_KEY:fx';
}

$apiUrl = getenv('DEEPL_API_URL');
if (!$apiUrl) {
  // default to free tier; change to https://api.deepl.com/v2/translate for paid
  $apiUrl = 'https://api-free.deepl.com/v2/translate';
}

// Handle both single text strings and arrays of texts (for batching)
$texts = $payload['text'];
if (!is_array($texts)) {
  $texts = [$texts];
}

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: DeepL-Auth-Key ' . $apiKey,
  'Content-Type: application/json',
  'Accept: application/json',
  'User-Agent: Immoaura-Website/1.0',
]);

$postData = [
  'text' => $texts,
  'target_lang' => $payload['target_lang'],
];

if (isset($payload['source_lang'])) {
  $postData['source_lang'] = $payload['source_lang'];
}

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($response === false) {
  $curlError = curl_error($ch);
  $curlErrno = curl_errno($ch);
  curl_close($ch);
  http_response_code(502);
  echo json_encode([
    'error' => 'Proxy request failed',
    'details' => $curlError,
    'errno' => $curlErrno
  ]);
  exit;
}

curl_close($ch);

if ($httpCode >= 400) {
  http_response_code($httpCode);
  $errorData = json_decode($response, true);
  if ($errorData && isset($errorData['message'])) {
    echo json_encode(['error' => $errorData['message']]);
  } else {
    echo $response ?: json_encode(['error' => 'DeepL API returned error', 'status' => $httpCode]);
  }
  exit;
}

http_response_code(200);
echo $response;
?>
```

### Step 2: Get DeepL API Key

1. Visit [DeepL API Console](https://www.deepl.com/pro/account)
2. Sign up for free tier or paid plan
3. Copy your API key
4. Replace `YOUR_DEEPL_API_KEY` in the PHP file with your actual key

### Step 3: Update Environment Variables (Optional)

If your Hostinger plan supports environment variables:

1. Go to Hostinger Control Panel
2. Find "Environment Variables" or "PHP Configuration"
3. Add:
   ```
   DEEPL_API_KEY=your-api-key:fx
   DEEPL_API_URL=https://api-free.deepl.com/v2/translate
   ```

---

## How It Works

### User Journey

1. **First Visit to Dashboard:**
   ```
   User Login
      ↓
   Dashboard Loads
      ↓
   LanguageSelector Modal Appears
      ↓
   User Selects Language (NL/FR/DE/EN)
      ↓
   Preference Saved to localStorage
      ↓
   Dashboard Content Loads
   ```

2. **Language Persistence:**
   - Selected language stored in `localStorage`
   - Available on all pages
   - Can be changed anytime from sidebar switcher

3. **Translation Flow:**
   ```
   useLanguage() hook in component
      ↓
   Component calls translateText("Original text")
      ↓
   API request to /api/translate.php
      ↓
   PHP proxy calls DeepL API
      ↓
   Translation returned
      ↓
   UI updates with translated text
   ```

---

## Usage in Components

### Example 1: Using Language Context

```typescript
import { useLanguage } from "@/contexts/LanguageContext";

function MyComponent() {
  const { language, translateText } = useLanguage();
  const [translatedText, setTranslatedText] = useState("");

  useEffect(() => {
    translateText("Hello World").then(setTranslatedText);
  }, [language]);

  return <div>{translatedText}</div>;
}
```

### Example 2: Language Switcher in Sidebar

Already integrated in `DashboardLayout`:

```typescript
<LanguageSwitcher />
```

Shows quick buttons: 🇳🇱 NL | 🇫🇷 FR | 🇩🇪 DE | 🇬🇧 EN

### Example 3: Initial Language Selection

Modal shows on first dashboard visit:

```typescript
<LanguageSelector />
```

---

## Key Features

✅ **First-Time Language Selection**
- Beautiful modal with flag emojis
- 4 language options
- Saved preference

✅ **Persistent Language**
- Stored in localStorage
- Survives page refresh
- Per-user preference

✅ **Real-Time Translation**
- DeepL API integration
- Support for 4 languages
- Graceful fallback to English

✅ **Easy Language Switching**
- Sidebar language switcher
- One-click language change
- Immediate UI update

✅ **API Proxy**
- PHP proxy on your hosting
- No exposing API keys to frontend
- Handles translation requests securely

---

## Components Files

### 1. LanguageContext
**File:** `src/contexts/LanguageContext.tsx`

Provides:
- `language`: Current language code
- `setLanguage()`: Change language
- `translateText()`: Translate text to target language
- `isTranslating`: Loading state

### 2. LanguageSelector
**File:** `src/components/LanguageSelector.tsx`

Features:
- Shows on first dashboard visit
- 4 language buttons with flags
- Beautiful modal UI
- Auto-hides after selection
- Remember preference checkbox implied

### 3. LanguageSwitcher
**File:** `src/components/LanguageSwitcher.tsx`

Features:
- Compact button group
- Shows current language
- Quick toggle between languages
- Integrated in sidebar

---

## File Modifications

### Modified Files

1. **src/App.tsx**
   - Added `<LanguageProvider>` wrapper
   - Wraps entire application

2. **src/pages/Dashboard.tsx**
   - Added `<LanguageSelector />` component
   - Shows language modal on first visit

3. **src/components/dashboard/DashboardLayout.tsx**
   - Added `<LanguageSwitcher />` in sidebar
   - Between navigation and sign out

---

## Testing

### Test 1: First Visit Language Selection
1. Clear browser localStorage
2. Go to `/dashboard`
3. Language selector modal appears ✓
4. Select a language
5. Modal closes ✓

### Test 2: Language Persistence
1. Select a language
2. Refresh page (Cmd+Shift+R)
3. Same language remains selected ✓

### Test 3: Language Switching
1. Click different language in sidebar
2. UI updates immediately ✓

### Test 4: Translation
1. Select non-English language
2. Dashboard text translates
3. Check console for successful API calls ✓

---

## Troubleshooting

### Issue: "Translation API Error"

**Possible Causes:**
- Invalid API key
- DeepL API down
- Network error

**Solution:**
1. Check API key in `/api/translate.php`
2. Test API key on [DeepL website](https://www.deepl.com)
3. Check browser console for errors
4. Verify CORS headers are set

### Issue: "Language Not Changing"

**Possible Causes:**
- localStorage not clearing
- Old preferences cached

**Solution:**
1. Clear browser cache
2. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Hard refresh (Cmd+Shift+R)

### Issue: "Modal Not Appearing"

**Possible Causes:**
- localStorage already has `languageSelected`
- Context not wrapped properly

**Solution:**
1. Clear `languageSelected` from localStorage
2. Verify `<LanguageProvider>` in `App.tsx`
3. Check console for React errors

---

## Deployment Checklist

- [ ] Upload `/api/translate.php` to hosting
- [ ] Set DeepL API key in PHP file or env vars
- [ ] Test translation endpoint: `POST /api/translate.php`
- [ ] Verify CORS headers in PHP
- [ ] Test language selection on dashboard
- [ ] Test language switching in sidebar
- [ ] Clear cache and test fresh visit
- [ ] Check console for errors
- [ ] Test on mobile view
- [ ] Verify localStorage persistence

---

## Next Steps (Optional Enhancements)

1. **Add More Languages**
   - Update language list in LanguageSelector
   - DeepL supports 20+ languages

2. **Translation Caching**
   - Cache translations locally
   - Reduce API calls

3. **Dynamic UI Translation**
   - Translate all UI strings
   - Use translation keys/i18n

4. **Admin Language Support**
   - Add LanguageSelector to admin dashboard
   - Same process as client dashboard

---

## Support

For issues or questions:
1. Check browser console (F12)
2. Verify DeepL API key
3. Test PHP endpoint directly
4. Review localStorage (F12 > Application > Storage)

