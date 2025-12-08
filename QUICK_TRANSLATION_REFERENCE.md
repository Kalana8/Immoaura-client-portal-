# 🚀 Quick Translation Reference

## The 4-Step Pattern

Apply this pattern to any component that needs multi-language support:

```typescript
// STEP 1: Import
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

// STEP 2: Get Language
const { language } = useLanguage();

// STEP 3: Get Translations (with fallback)
const trans = translations[language]?.pageName || translations.EN.pageName;

// STEP 4: Use in JSX
<h1>{trans.title}</h1>
<p>{trans.subtitle}</p>
```

---

## Available Translations

### Pages Fully Translated ✅

```
✅ Dashboard     → trans.dashboard.{title, subtitle}
✅ Orders       → trans.orders.{title, subtitle, newOrder, noOrders}
✅ Invoices     → trans.invoices.{title, subtitle, download, noInvoices}
✅ Messages     → trans.messages.{title, subtitle, noMessages}
✅ Profile      → trans.profile.{title, subtitle, editProfile, saveChanges}
✅ NewOrder     → trans.newOrder.{title, subtitle}
✅ OrderDetail  → trans.orderDetail.{title, orderSummary, orderTimeline, files, invoices}
```

### Languages Supported 🌍

```
EN = English   🇬🇧
FR = French    🇫🇷
DE = German    🇩🇪
NL = Dutch     🇳🇱
```

---

## Real-World Examples

### Example 1: Simple Page Title
```typescript
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

const MyPage = () => {
  const { language } = useLanguage();
  const trans = translations[language]?.dashboard || translations.EN.dashboard;
  
  return <h1>{trans.title}</h1>;  // "Dashboard" / "Tableau de bord" / etc.
};
```

### Example 2: Multiple Translations
```typescript
const { language } = useLanguage();
const trans = translations[language]?.orders || translations.EN.orders;

return (
  <div>
    <h1>{trans.title}</h1>              // Orders / Commandes / etc.
    <p>{trans.subtitle}</p>              // Manage and track... / Gérez...
    <button>{trans.newOrder}</button>    // New Order / Nouvelle Commande
    {orders.length === 0 && (
      <p>{trans.noOrders}</p>           // No orders yet / Aucune commande
    )}
  </div>
);
```

### Example 3: Fallback to English
```typescript
// If user has unsupported language or missing translation
const trans = translations[language]?.unknownPage || translations.EN.unknownPage;
// Will always fall back to English
```

---

## Adding New Translations

### 1️⃣ Update translations.ts

```typescript
export const translations = {
  EN: {
    myNewPage: {
      title: "My Page Title",
      description: "My page description"
    }
  },
  FR: {
    myNewPage: {
      title: "Le titre de ma page",
      description: "La description de ma page"
    }
  },
  DE: {
    myNewPage: {
      title: "Mein Seitentitel",
      description: "Meine Seitenbeschreibung"
    }
  },
  NL: {
    myNewPage: {
      title: "Mijn paginatitel",
      description: "Mijn paginabeschrijving"
    }
  }
};
```

### 2️⃣ Use in Component

```typescript
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

const MyNewPage = () => {
  const { language } = useLanguage();
  const trans = translations[language]?.myNewPage || translations.EN.myNewPage;
  
  return (
    <div>
      <h1>{trans.title}</h1>
      <p>{trans.description}</p>
    </div>
  );
};

export default MyNewPage;
```

---

## How Language Switching Works

### For Users:

1. **First Visit** → Language selector modal appears
2. **Select Language** → Preference saved to localStorage
3. **Navigate Pages** → Language persists across all pages
4. **Change Language** → Click language button in dashboard header
5. **All Pages Update** → Real-time without page reload

### For Developers:

1. Language context updates
2. `setLanguage()` saves to localStorage
3. Custom `languageChanged` event fires
4. All components listening re-render
5. UI updates instantly

---

## Current File Status

### ✅ Files Updated
- `src/pages/Orders.tsx`
- `src/pages/Invoices.tsx`
- `src/pages/Messages.tsx`
- `src/pages/Profile.tsx`
- `src/pages/NewOrder.tsx`
- `src/pages/OrderDetail.tsx`
- `src/pages/Dashboard.tsx`

### ✅ Supporting Files
- `src/contexts/LanguageContext.tsx` - Language state management
- `src/utils/translations.ts` - All translations
- `src/components/LanguageSelector.tsx` - First-visit modal
- `src/components/LanguageButtonSmall.tsx` - Dashboard header button
- `src/components/LanguageSwitcher.tsx` - Sidebar switcher

---

## Troubleshooting

### Issue: Translation not showing
```typescript
// ❌ Wrong
const trans = translations[language].page;

// ✅ Correct (with fallback)
const trans = translations[language]?.page || translations.EN.page;
```

### Issue: Language not changing
- Check if `useLanguage()` is imported
- Verify component is inside `<LanguageProvider>`
- Check browser console for errors

### Issue: Translation key missing
- Add key to all 4 languages in `translations.ts`
- Use fallback: `translations[language]?.page || translations.EN.page`
- Default will be English

---

## Build Verification

```bash
npm run build
# ✓ 2976 modules transformed
# ✓ built in 3.44s
```

✅ All translations build successfully!

---

## Summary

| Aspect | Status |
|--------|--------|
| Pages Updated | 7/7 ✅ |
| Languages | 4/4 ✅ |
| Build | Passing ✅ |
| Real-time Switching | Working ✅ |
| Documentation | Complete ✅ |

**All pages are now fully translatable and production-ready!** 🎉

