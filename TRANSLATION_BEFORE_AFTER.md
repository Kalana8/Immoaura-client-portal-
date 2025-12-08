# Translation Pattern: Before & After

## BEFORE (Hardcoded)

### Orders.tsx
```typescript
// ❌ BEFORE: Hardcoded strings
<h1 className="text-3xl font-bold">Orders</h1>
<p className="text-muted-foreground mt-2">
  Manage and track all your orders
</p>
<Button onClick={() => navigate("/orders/new")} className="gap-2">
  <Plus className="h-4 w-4" />
  New Order
</Button>
```

---

## AFTER (Translatable)

### Orders.tsx
```typescript
// ✅ AFTER: Fully translatable

// Step 1: Import
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

// Step 2 & 3: Get language and translations
const { language } = useLanguage();
const trans = translations[language]?.orders || translations.EN.orders;

// Step 4: Use in JSX
<h1 className="text-3xl font-bold">{trans.title}</h1>
<p className="text-muted-foreground mt-2">
  {trans.subtitle}
</p>
<Button onClick={() => navigate("/orders/new")} className="gap-2">
  <Plus className="h-4 w-4" />
  {trans.newOrder}
</Button>
```

---

## Language-Specific Output

### English (EN)
```
Title: Orders
Subtitle: Manage and track all your orders
Button: New Order
```

### French (FR)
```
Title: Commandes
Subtitle: Gérez et suivez toutes vos commandes
Button: Nouvelle Commande
```

### German (DE)
```
Title: Bestellungen
Subtitle: Verwalten und verfolgen Sie alle Ihre Bestellungen
Button: Neue Bestellung
```

### Dutch (NL)
```
Title: Bestellingen
Subtitle: Beheer en volg al uw bestellingen
Button: Nieuwe Bestelling
```

---

## All Pages Updated with Same Pattern

| File | Before | After |
|------|--------|-------|
| src/pages/Orders.tsx | Hardcoded | ✅ Translatable |
| src/pages/Invoices.tsx | Hardcoded | ✅ Translatable |
| src/pages/Messages.tsx | Hardcoded | ✅ Translatable |
| src/pages/Profile.tsx | Hardcoded | ✅ Translatable |
| src/pages/NewOrder.tsx | Hardcoded | ✅ Translatable |
| src/pages/OrderDetail.tsx | Hardcoded | ✅ Translatable |
| src/pages/Dashboard.tsx | Partially | ✅ Fully Translatable |

---

## Translation Keys Structure

### Centralized: src/utils/translations.ts

```typescript
export const translations = {
  EN: {
    orders: { 
      title: "Orders",
      subtitle: "Manage and track all your orders",
      newOrder: "New Order",
      noOrders: "No orders yet."
    },
    invoices: { ... },
    messages: { ... },
    profile: { ... },
    newOrder: { ... },
    orderDetail: { ... }
  },
  FR: { ... },
  DE: { ... },
  NL: { ... }
};
```

---

## Key Benefits

### ✅ Consistency
- All pages use the same pattern
- Easy to maintain and extend

### ✅ Scalability
- Add new translations without modifying components
- Centralized translation management

### ✅ Performance
- No runtime translation API calls for main UI
- Translations are static objects in-memory

### ✅ Real-Time Updates
- Change language → All pages update instantly
- No page reload needed

### ✅ Fallback Support
- If translation missing → Falls back to English
- `translations[language]?.page || translations.EN.page`

---

## How to Add New Translations

### 1. Add Key to translations.ts
```typescript
export const translations = {
  EN: {
    customPage: {
      title: "My Title",
      description: "My Description"
    },
    // ... other keys
  },
  FR: { customPage: { title: "...", description: "..." } },
  DE: { customPage: { title: "...", description: "..." } },
  NL: { customPage: { title: "...", description: "..." } },
};
```

### 2. Use in Component
```typescript
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";

const MyComponent = () => {
  const { language } = useLanguage();
  const trans = translations[language]?.customPage || translations.EN.customPage;

  return (
    <div>
      <h1>{trans.title}</h1>
      <p>{trans.description}</p>
    </div>
  );
};
```

---

## Summary

🎯 **Pattern Applied Successfully**

- ✅ 7 pages updated
- ✅ 4 languages supported
- ✅ 100% of page titles & subtitles translatable
- ✅ Real-time language switching works
- ✅ Build passes without errors

**The 4-step pattern is now the standard for all new translatable content!**

