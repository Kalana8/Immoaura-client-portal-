**Backend** 

Forms,

Individual Sign up

First Name\*

Last Name\*

Email\*

Phone No\*

Street Name\*

Street no\*

Post bus (Optional)

City\*

Postal Code\*

Username\* ( Already written email will become the username automatically)

Password\*

Repeat password\*

Accept Terms & Conditions (checkbox)

GDPR Consent (checkbox)

For Business signup

Business Name\*

BTW No\*

Business email\*

Business Phone number\*

Business Address\*

Username\* ( Already written business email will become the username automatically)

Password\*

Repeat password\*

Accept Terms & Conditions (checkbox)

GDPR Consent (checkbox)

**Individual Sign Up**

## **7\) Client Portal (authenticated)**

**Left sidebar:** Dashboard • Orders • Invoices • Profile • Logout

### **7.1 Dashboard**

* KPI cards: Total Orders, In Review, Confirmed, Planned, Delivered, Completed; Total Spent.

* Chart: orders per maand (12m).

* Recent orders list.

### **7.2 Orders**

* Table with filters (status, datum).

* **New Order** wizard: Service(s) → Configure → Agenda → Review → Confirm.

* Order detail: summary (price breakdown), timeline, messages, **file uploads** (client \+ admin), deliverables, invoice link.

**Statuses (state machine):**  
 `In Review → Confirmed → Planned → Delivered → Completed`

* Admin can move forward/back one step and cancel (Canceled).

* **Payment status:** Unpaid → (Partial) Paid.

### **7.3 Invoices**

* Table: Invoice \#, Order \#, date, amount, status, download button.

* Admin uploads PDF; marks status Paid/Unpaid.

### **7.4 Profile**

* Business / Full name, E-mail, Phone, **BTW-nummer**, Address, Preferred language (NL default).

  There should be two types here I will update,

---

## **8\) Ordering Wizard (fields & validation)**

**Step 1 — Choose Service(s)** (multi-select): Property Video / 2D / 3D

**Step 2 — Configure**

* **Property Video**

  * Package: Starter / Standard / Premium *(required)*

  * Property: type, m², rooms (ints ≥0), address/city *(required)*, access notes

  * Options: VO (y/n \+ taal), Twilight (y/n), Extra social cut (4:5/1:1), Rush 24u (y/n)

  * Uploads: logo, music (optional)

* **2D Floor Plans** *(marketingplan)*

  * Niveaus *(required, int ≥1)*, m² per niveau *(int ≥10)*

  * Outputs: PDF/PNG/SVG (multi)

  * Options: DWG (y/n), Rush 24u (y/n)

  * Uploads: schetsen/plannen/foto’s (PDF/JPG/PNG/DWG; ≤10 bestanden; totaal ≤200MB)

  * Tooltip: “Marketingplan — **niet** voor vergunning/bouw.”

* **3D Floor Plans** *(marketing 3D)*

  * Niveaus *(required)*, **Kwaliteit** *(Basic/Enhanced/Photoreal)*,

  * View: isometrisch/perspectief (Enhanced/Photoreal: 1–2 zichten),

  * Style/mood (tekst), Twilight (y/n), **Fly-through** (y/n),

  * Uploads: materialen/moodboard (multi)

  * Tooltip: “Marketing 3D — **niet** voor bouw.”

**Step 3 — Agenda (service-specific)**

* Show only **Property Video** shoot slots (date/time) that admin pre-publishes.

* Already booked slots \= **disabled** for everyone.

* On **Confirm** (admin), slot locks across system.

**Step 4 — Review**

* Price breakdown: packages, options, BTW %, **Total**.

* Checkbox: **“Ik bevestig mijn bestelling.”**

* Submit → create **Order** with status **In Review**; send email to client \+ admin.

---

## **9\) Pricing Engine (calculation rules)**

* **Video:** package price \+ selected add-ons; no drone surcharge.

* **2D:** package (1/2/3 niveaus) \+ extra niveaus × €150 \+ large-level surcharges \+ options.

* **3D:** per-niveau price × aantal niveaus \+ options.

* **Bundles:** if exact combination matches, apply bundle price; else calculate line-items.

* Add **BTW** at end.

* Pricing table editable via **Options page (ACF)** or JSON config in child theme.

---

## **10\) Data Model**

**CPT: `immo_order`**

* order\_number (string, seq: IM-000001…)

* client\_id (user)

* services\_selected (array)

* config\_video (json)

* config\_2d (json)

* config\_3d (json)

* agenda\_slot (datetime)

* price\_breakdown (json)

* total\_excl\_vat (decimal)

* vat\_rate (decimal)

* total\_incl\_vat (decimal)

* status (enum: in\_review, confirmed, planned, delivered, completed, canceled)

* payment\_status (enum: unpaid, partial, paid)

* files\_client (media IDs)

* files\_admin (media IDs)

* created\_at / updated\_at (timestamps)

**CPT: `immo_invoice`**

* invoice\_number (string, seq: INV-YYYY-000001…)

* order\_ref (post ID)

* amount\_excl\_vat / vat / total

* pdf\_media\_id

* status (unpaid, partial, paid)

* issued\_at / due\_at (dates)

**Taxonomies:** `location`, `type`, `service` for Portfolio CPT.

---

## **11\) Calendar & Availability**

* Admin panel to define **service-specific slots** (e.g., Video shoots Tue/Thu, 09:00–13:00; 14:00–18:00).

* Slots stored as entries with capacity=1.

* Client sees **only future free slots** for Video service.

* On admin **Confirm** \+ set slot → system marks slot **booked** (no double-booking).

*(Implementation options: bookings plugin with per-service schedules OR custom post type `immo_slot` with status free/booked \+ small REST handler for availability.)*

---

## **12\) Emails & Notifications (NL; translatable)**

* **Order submitted (In Review):** to client \+ admin (order summary \+ files).

* **Order confirmed:** to client (date/time if applicable, next steps, invoice timing).

* **Order planned:** to client (agenda locked; reminder 24u vooraf).

* **Order delivered:** to client (download links, invoice reminder).

* **Invoice issued / overdue:** to client.  
   All templates translatable; include order\_number / invoice\_number.

---

## **13\) Front-End Components & Styles**

* Container 1200px, 24px gutters; vertical rhythm 80–120px.

* Surfaces: white or **\#F2F3F3**; text **\#231F20**; accents/links/buttons **\#243E8F**.

* Dividers: 1px `rgba(35,31,32,.12)` on white or **\#E7E9EC** on **\#F2F3F3**.

* Buttons: Primary filled **\#243E8F** (hover \~8% darker), Secondary outline **\#243E8F**.

* Icons: thin-line (camera, grid/2D, cube/3D, house, drone).

* Slogan treatment: **“Film. Plan. Verkoop.”** (badges: **FILM • PLAN • VERKOOP**).

* Accessibility: focus states visible, labels/ARIA on forms, color contrast AA.

---

## **14\) SEO, Legal, Analytics**

* Schema: **LocalBusiness**, **Service**, **Product** (packages), **FAQPage**.

* Titles/meta; one H1 per page; alt text for media.

* Cookie consent; Privacy, Terms, Cookies pages; License & Usage Rights page clarifies marketing vs. bouwdocumenten.

* GA4 (consent mode), optional Meta Pixel.

---

## **15\) Security & Ops**

* reCAPTCHA v3 on all forms; honeypot.

* Hardened WP (disable XML-RPC if unneeded, limit login, least-privilege roles).

* Backups: daily, 14-day retention.

* Media privacy: **private URLs** for delivered assets (only owner \+ admin).

---

## **16\) Acceptance Criteria (go/no-go)**

1. **Brand/UI:** Colors/typography match spec; NL is default language; switcher NL→FR→DE→EN works.

2. **Navigation:** All menu/CTAs route; sticky header OK; footer complete.

3. **Pricing:** Matches section 5; totals, VAT, bundles compute correctly.

4. **Order wizard:** Validates required fields; agenda shows only free slots; confirmation screen shows price breakdown; status set to **In Review**.

5. **Admin flow:** Can set **Confirmed → Planned** (slot locked) → **Delivered** (assets uploaded) → **Completed** (when invoice paid).

6. **Invoices:** Sequential numbers; attach PDF; status flips to Paid; order auto-completes when delivered \+ paid.

7. **Dashboard:** KPIs and chart render; order/invoice tables filter correctly.

8. **Portfolio:** Archive filters by Location/Type/Service; 9 dummy items show with video/image; case template renders.

9. **Performance:** LCP \< 2.5s mobile, CLS \< 0.1; images WebP; lazy-load; minified assets.

10. **Accessibility:** Keyboard nav, focus outlines, form errors announced.

11. **SEO:** Schema validates; sitemap live; robots OK.

---

## **17\) Build Plan (tasks for devs)**

1. **Setup**: WP, Hello, Elementor, Envato Elements; import Corner sections; set Site Settings (DM Sans; colors).

2. **CPTs**: `immo_order`, `immo_invoice`, Portfolio (+ taxonomies).

3. **Options page**: Pricing JSON (editable).

4. **Order wizard**: shortcode or small React/Vue embedded; steps & validation as §8; pricing engine §9; tooltips.

5. **Calendar**: per-service slots; REST endpoints: `/availability`, `/book_slot`.

6. **Dashboard**: KPIs (queries), chart (last 12m), tables (server-side pagination).

7. **Invoices**: numbering, upload PDF, status change; reference to order.

8. **Emails**: templates, triggers per status; translations.

9. **Public pages**: Home, Services (3), Portfolio (archive \+ case), About (subs), Contact; dummy portfolio content.

10. **Multilingual**: Polylang setup (NL default), duplicate key pages for FR/DE/EN later; hreflang.

11. **Performance**: WebP, lazy-load, cache/minify, dequeue unused Elementor assets.

12. **QA**: Acceptance Criteria §16; UAT with 3 dummy orders end-to-end.

---

## **18\) Copy & UI Strings (NL samples)**

* **Statuses:** In Review • Bevestigd • Gepland • Geleverd • Afgerond • Geannuleerd

* **Betaalstatus:** Onbetaald • Gedeeltelijk betaald • Betaald

* **Buttons:** Nieuwe bestelling • Bevestig order • Kies tijdslot • Upload bestanden • Markeer als betaald

* **Tooltips:** “Marketingplan — **niet** voor vergunning/bouw.” / “Niveau \= één verdieping.”

