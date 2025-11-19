# Project Mismatch Report: Backend.md vs Current Implementation

This document identifies discrepancies between the requirements in `Backend .md` and the current implementation.

---

## 🔴 CRITICAL MISMATCHES

### 1. **Order Number Format**
- **Backend.md Requirement:** `IM-000001...` (sequential format)
- **Current Implementation:** `ORD-YYYYMMDD-XXXX` (date-based with random suffix)
- **Location:** `src/components/orders/wizard/OrderWizard.tsx:99`
- **Action Required:** Change order number generation to sequential format `IM-000001`, `IM-000002`, etc.

### 2. **Invoice Number Format**
- **Backend.md Requirement:** `INV-YYYY-000001...` (format: INV-YYYY-NNNNNN)
- **Current Implementation:** Unknown - needs verification
- **Action Required:** Implement sequential invoice numbering with year prefix

### 3. **Email Notifications (Missing)**
- **Backend.md Requirement:** Email notifications for:
  - Order submitted (In Review) → client + admin
  - Order confirmed → client
  - Order planned → client
  - Order delivered → client
  - Invoice issued/overdue → client
- **Current Implementation:** ❌ NO EMAIL NOTIFICATIONS FOUND
- **Action Required:** Implement email notification system for all status changes

### 4. **File Uploads in Order Wizard (Missing)**
- **Backend.md Requirements:**
  - **Property Video:** Uploads for logo and music (optional)
  - **2D Floor Plans:** Uploads for schetsen/plannen/foto's (PDF/JPG/PNG/DWG; ≤10 files; ≤200MB total)
  - **3D Floor Plans:** Uploads for materialen/moodboard (multi-file)
- **Current Implementation:** ❌ FILE UPLOAD FIELDS NOT FOUND in configuration components
- **Action Required:** Add file upload functionality to:
  - `VideoConfiguration.tsx`
  - `Plan2DConfiguration.tsx`
  - `Plan3DConfiguration.tsx`

---

## ⚠️ MEDIUM PRIORITY MISMATCHES

### 5. **Business Signup Address Field**
- **Backend.md Requirement:** Single field "Business Address*"
- **Current Implementation:** Separate fields: "Street Name*" and "Address*"
- **Location:** `src/pages/Auth.tsx:632-654`
- **Action Required:** Consider if this meets the requirement or needs adjustment

### 6. **Review Step Confirmation Text**
- **Backend.md Requirement:** Checkbox text: **"Ik bevestig mijn bestelling."** (Dutch)
- **Current Implementation:** English text: "I confirm that all information provided is correct..."
- **Location:** `src/components/orders/wizard/OrderReview.tsx:193-196`
- **Action Required:** Update to Dutch text as specified

### 7. **Order Detail Page Features (Missing)**
- **Backend.md Requirement:** Order detail page should show:
  - Summary (price breakdown) ✅ (partially in review)
  - Timeline ❌
  - Messages ❌
  - File uploads (client + admin) ❌
  - Deliverables ❌
  - Invoice link ✅ (in orders list, needs detail page)
- **Current Implementation:** No dedicated order detail page found
- **Action Required:** Create order detail page with all required features

### 8. **Calendar Slots - Admin Panel (Missing)**
- **Backend.md Requirement:** Admin panel to define service-specific slots (e.g., Video shoots Tue/Thu, 09:00–13:00; 14:00–18:00)
- **Current Implementation:** Slots are auto-generated in client code, no admin panel
- **Location:** `src/components/orders/wizard/AgendaSelection.tsx:27-73`
- **Action Required:** Create admin panel for managing calendar slots

### 9. **Slot Capacity Setting**
- **Backend.md Requirement:** Slots stored with `capacity=1`
- **Current Implementation:** Slots have `capacity: 3` in generated slots
- **Location:** `src/components/orders/wizard/AgendaSelection.tsx:63`
- **Action Required:** Set capacity to 1 as per specification

### 10. **Pricing Engine - Bundle Support (Missing)**
- **Backend.md Requirement:** "Bundles: if exact combination matches, apply bundle price; else calculate line-items."
- **Current Implementation:** Only individual line-item calculation
- **Location:** `src/lib/pricing.ts`
- **Action Required:** Add bundle pricing logic

---

## 📋 LOW PRIORITY / DESIGN MISMATCHES

### 11. **UI Colors (May Need Verification)**
- **Backend.md Requirement:**
  - Surfaces: white or `#F2F3F3`
  - Text: `#231F20`
  - Accents/links/buttons: `#243E8F`
  - Dividers: `rgba(35,31,32,.12)` or `#E7E9EC`
- **Current Implementation:** Uses Tailwind default colors
- **Action Required:** Verify and update color scheme if needed

### 12. **Container Width**
- **Backend.md Requirement:** Container 1200px
- **Current Implementation:** Uses responsive design with `max-w-4xl` (varies)
- **Action Required:** Ensure container matches 1200px max width

### 13. **Tooltip Text Language**
- **Backend.md Requirement:**
  - 2D: "Marketingplan — **niet** voor vergunning/bouw." (Dutch)
  - 3D: "Marketing 3D — **niet** voor bouw." (Dutch)
- **Current Implementation:** English text in info boxes
- **Location:** 
  - `Plan2DConfiguration.tsx:77-79`
  - `Plan3DConfiguration.tsx:100-102`
- **Action Required:** Update to Dutch as specified

---

## ✅ CORRECTLY IMPLEMENTED

### Forms & Authentication
- ✅ Individual signup form with all required fields
- ✅ Business signup form with BTW number
- ✅ Terms & Conditions and GDPR consent checkboxes
- ✅ Username auto-fills from email
- ✅ Password validation

### Dashboard
- ✅ KPI cards (Total Orders, In Review, Confirmed, Planned, Delivered, Completed, Total Spent)
- ✅ Orders chart (needs verification for 12-month range)
- ✅ Recent orders list

### Orders
- ✅ Orders table with filters (status)
- ✅ New Order wizard with 4 steps (Service → Configure → Agenda → Review)
- ✅ Status state machine (in_review → confirmed → planned → delivered → completed)
- ✅ Payment status (unpaid, partial, paid)

### Profile
- ✅ Business/Full name, Email, Phone, BTW-nummer, Address, Preferred language (NL default)

### Pricing Engine
- ✅ Video: package price + add-ons
- ✅ 2D: base package + extra levels × €150 + large-level surcharges + options
- ✅ 3D: per-level price × number of levels + options
- ✅ BTW calculation (21%)

### Service Configuration
- ✅ Property Video: Package selection, property details, all add-ons
- ✅ 2D Floor Plans: Levels, square meters, outputs, options
- ✅ 3D Floor Plans: Levels, quality, views, style/mood, options

---

## 📝 SUMMARY OF REQUIRED CHANGES

### High Priority
1. Fix order number format: `IM-000001...` instead of `ORD-YYYYMMDD-XXXX`
2. Implement email notification system for all order status changes
3. Add file upload functionality to all service configuration steps
4. Create order detail page with timeline, messages, file uploads, deliverables

### Medium Priority
5. Create admin panel for calendar slot management
6. Fix slot capacity to 1 (currently 3)
7. Update confirmation text to Dutch: "Ik bevestig mijn bestelling."
8. Implement bundle pricing logic
9. Verify and fix invoice number format

### Low Priority
10. Update UI tooltip/info text to Dutch
11. Verify color scheme matches specification
12. Ensure container width is 1200px max

---

## 🔍 FILES THAT NEED MODIFICATION

1. `src/components/orders/wizard/OrderWizard.tsx` - Order number format
2. `src/components/orders/wizard/config/VideoConfiguration.tsx` - Add file uploads
3. `src/components/orders/wizard/config/Plan2DConfiguration.tsx` - Add file uploads
4. `src/components/orders/wizard/config/Plan3DConfiguration.tsx` - Add file uploads
5. `src/components/orders/wizard/OrderReview.tsx` - Update confirmation text
6. `src/components/orders/wizard/AgendaSelection.tsx` - Fix capacity, add admin slot management
7. `src/lib/pricing.ts` - Add bundle pricing
8. Create new files:
   - Order detail page component
   - Email notification service
   - Admin calendar slot management component
   - Invoice number generation utility

