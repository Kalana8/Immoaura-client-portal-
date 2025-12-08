# **Admin Brief \- Immoaura (Backend & QA)**

## **1\) Orders: flow & backend controls**

* **Default state:** Every new order \= **In Review** automatically.

* **Admin actions (Order detail page):**

  * Change state: In Review → Confirmed → Planned → Delivered → Completed (and Cancelled).

  * Assign/lock **calendar slot** (for Video only) when setting **Planned**.

  * Upload/download **deliverables** (files\_admin) and message the client.

* **UI:** Status dropdown \+ timeline; price breakdown always visible.

* **Emails (auto):**

  * On submit (In Review) → client \+ admin.

  * On Confirmed → client (date/time or “awaiting slot”).

  * On Planned → client (with slot \+ 24h reminder).

  * On Delivered → client (download links \+ invoice reminder).

## **2\) Order numbers & unique-key fix**

* **Issue:** `duplicate key value violates unique constraint "orders_order_number_key"`.

* **Fix:** Generate `IM-000001…` **atomically**:

  * Use a **single source** (options table counter or custom DB sequence).

  * Increment **inside a transaction** before saving the post/meta.

  * Re-try once on collision; never compute with `max()+1`.

* **Acceptance:** 100 test orders in parallel → no duplicates.

## **3\) Invoices (manual issue by admin)**

* **Create from Order:** “Create Invoice” button pre-fills:

  * **Invoice number:** `INV-YYYY-000001…` (year-scoped, sequential).

  * **Issue date:** today (editable).

  * **Expiry date:** \+14 days (editable).

  * **Reference:** order\_number.

  * **Amount:** `total_incl_vat` (editable).

* **Admin uploads PDF** (required to set status to Issued).

* **Statuses:** Unpaid / Partial / Paid (toggle).

* **Auto-actions:** When Invoice \= Paid **and** Order \= Delivered → auto set Order \= Completed.

* **Emails:** Invoice issued \+ overdue reminders.

## **4\) Calendar (global availability, 12-month view)**

* **Admin screen:** Global calendar for **Property Video** with **blackout** & **open** slots.

  * Show next **12 months**.

  * Slots \= capacity 1; toggled by click/drag (e.g., 09:00–13:00, 14:00–18:00).

  * Bulk actions: **Repeat weekly** pattern; **copy month**; **clear month**.

* **Frontend booking step:** Show only **free** future slots; booked/blocked \= disabled.

* **Locking:** On **Admin → Confirmed/Planned**, selected slot **locks system-wide** (no double booking).  
