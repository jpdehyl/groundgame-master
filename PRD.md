# GroundGame Master — Product Requirements Document

**Version:** 1.0
**Last updated:** 2026-02-10
**Status:** MVP scope locked

---

## 1. Product Overview

GroundGame Master is an internal operations platform for managing international contractors, processing payroll, and billing clients. It replaces spreadsheets and manual CSV workflows with a single system of record.

The company places contractors (primarily offshore) at client companies in roles like SDR, Manager, and Analyst. The company pays contractors via Veem and bills clients at a markup. This platform automates that entire cycle: onboarding, pay periods, payroll exports, and client invoicing.

---

## 2. Problem Statement

Today the workflow is:

1. Contractor data lives in spreadsheets
2. Payroll is calculated manually every two weeks
3. CSVs are hand-built for Veem (contractor payments) and QuickBooks (client invoices)
4. Documents (contracts, W-8BEN) are scattered in Google Drive with no expiry tracking
5. Contractors have no self-service visibility into their pay or leave balances

This is slow, error-prone, and doesn't scale.

---

## 3. Users & Roles

| Role | Who | Access |
|------|-----|--------|
| **Admin** | Internal operations staff | Full access — manage contractors, clients, pricing, payroll, invoices, documents, settings |
| **Contractor** | Placed contractor | Read-only portal — view own pay, leave balances, documents |

Authentication is Google OAuth / Google Workspace SSO. Role is stored in the `users` table.

---

## 4. Core Entities & Relationships

```
clients ──< client_pricing >── roles
   │                             │
   └──< employees >──────────────┘
          │
          ├──< documents
          ├──< time_off
          ├──< work_entries ──> pay_periods
          │                        │
          │                   payroll_runs
          │                        │
          └──< payroll_entries >───┘
```

**Key tables:** `clients`, `employees`, `roles`, `client_pricing`, `documents`, `pay_periods`, `work_entries`, `time_off`, `payroll_runs`, `payroll_entries`, `client_invoices`, `invoice_line_items`, `users`, `audit_log`.

Full schema: `database/schema.sql`

---

## 5. Contractor Management

### Onboarding

Admin creates a contractor record with:

- Name, email, phone
- Client assignment and role assignment
- Employment type (`contractor` or `employee`)
- Start date, compensation, pay frequency (weekly / biweekly / monthly)
- Technical requirements: internet speed (up/down), computer serial number

### Lifecycle

- Status transitions: `active` → `inactive` → `terminated`
- End date set on termination
- Client/role reassignment supported (no history tracking in MVP — just overwrite)

### What contractors see (portal)

- Current pay period status
- Last payment summary
- PTO / sick / unpaid leave balances
- Their documents (contract, W-8BEN) in one place

Contractors **do not** see formulas, rates, or calculation breakdowns.

---

## 6. Client & Pricing Management

### Clients

- Company name, email, contact person, billing address
- Status: `active` / `inactive`

### Pricing

Each role has a **base hourly rate** in the `roles` table.

Clients can have **overridden rates** per role via `client_pricing`, with effective date ranges:

- `effective_from` / `effective_to` support rate changes without losing history
- Unique constraint on `(client_id, role_id, effective_from)` prevents conflicts

**Billing rate** (what we charge the client) is stored in `client_pricing`. **Contractor pay rate** is stored in `employees.salary_compensation` and `roles.hourly_rate`. The margin is implicit — the system does not calculate or display it.

---

## 7. Payroll Processing

### Pay Periods

- Types: weekly, biweekly, monthly
- States: `open` → `closed` → `processed`
- Admin creates and closes periods manually (automation in Phase E)

### Work Entries

Per contractor, per day, within a pay period:

- Hours worked
- Leads processed (for lead-based bonuses)
- SPIFs (ad-hoc bonuses, dollar amount)

### Payroll Calculation

```
base_pay     = base_hours × hourly_rate
leads_bonus  = (per contractor, entered directly)
spifs_bonus  = (per contractor, entered directly)
total_gross  = base_pay + leads_bonus + spifs_bonus
deductions   = (manual, if any)
net_pay      = total_gross - deductions
```

No tax withholding — these are international contractors (W-8BEN, not W-2).

### Proration

If a contractor starts or terminates mid-period, pay is prorated by working days within the period. This is a business logic calculation, not stored in the schema.

### Payroll Run

1. Admin creates a payroll run for a closed pay period (status: `draft`)
2. System generates `payroll_entries` for all active contractors in that period
3. Admin reviews and confirms (status: `processed`)
4. Admin exports Veem CSV (status: `sent`)

### Veem CSV Export

The exported CSV must match Veem's exact import format. Fields include contractor name/email, payment amount, currency. Server-side generation, logged with timestamp and user.

### Idempotency

Same inputs must always produce the same payroll output. Re-running a payroll for the same period produces identical results.

---

## 8. Client Billing & Invoicing

### Invoice Generation

Per client, per pay period:

1. System aggregates all contractor hours assigned to that client
2. Applies the client-specific rate from `client_pricing` (falling back to base `roles.hourly_rate`)
3. Generates `invoice_line_items` per contractor
4. Totals into a `client_invoice`

### Invoice Lifecycle

- States: `draft` → `sent` → `paid`
- Invoice numbers are unique and auto-generated

### QuickBooks CSV Export

Invoices export to a CSV matching QuickBooks import format. Server-side generation, logged with timestamp and user.

---

## 9. Document Management

### Storage

Documents are stored in **Google Drive**. The database stores:

- `google_drive_id` — file ID
- `google_drive_url` — direct link
- Document type: `contract`, `w8ben`, `other`

Permissions are managed via Google Workspace, not by this application.

### W-8BEN Tracking

- W-8BEN forms expire after 3 years
- `expiry_date` is set on upload
- System surfaces expiring/expired W-8BEN forms (index exists on `expiry_date` for this)
- Renewal reminders via email (Phase E)

---

## 10. Time-Off & Leave

### Leave Types

| Type | Behavior |
|------|----------|
| **PTO** | Paid, deducted from balance |
| **Sick** | Paid, deducted from balance |
| **Unpaid** | Not paid, reduces working days in period |

### Workflow

1. Contractor submits request (start date, end date, reason)
2. Admin approves or denies
3. Approved time off affects payroll calculation for the overlapping pay period

Half-day support: `days_count` is `DECIMAL(4,2)`.

---

## 11. Reporting & Exports

### Admin Reports

- Contractor list by client, role, country, status
- Payroll summaries per period
- Client billing summaries
- W-8BEN compliance (expiring/expired)

### CSV Exports

All exports are:

- Generated server-side
- Logged in `audit_log` with timestamp and user
- Downloadable via the admin UI with one click

Export types:

| Export | Format Target |
|--------|--------------|
| Contractor payroll | Veem CSV |
| Client invoices | QuickBooks CSV |
| General reports | Standard CSV |

---

## 12. Audit & Compliance

### Audit Log

The `audit_log` table records:

- Who (`user_id`)
- What (`action`, `table_name`, `record_id`)
- Before/after values (`old_values`, `new_values` as JSONB)
- When (`timestamp`)

### What Gets Logged

- Payroll runs created, confirmed, exported
- Contractor status changes
- Rate changes
- Document uploads
- Time-off approvals/denials
- Invoice generation and exports

---

## 13. UX & Design Requirements

### Visual Direction

Clean, modern, minimalist. Reference points: **Deel**, **Veem**.

- Neutral color palette with plenty of white space
- Clear typography, strong visual hierarchy
- Simple data tables — no cluttered dashboards
- Minimal clicks for common actions (view pay, export payroll, view documents)
- Financial-grade feel — trustworthy, professional
- Accessible to non-technical users

### Contractor Portal

On login, the contractor immediately sees:

- Current pay period status
- Last payment summary
- PTO / sick / unpaid leave balances
- Their documents

No formulas, no rates, no internal calculations exposed.

### Admin Dashboard

- Tables for contractors, clients, pricing, payroll runs
- Filters by client, role, status
- One-click CSV exports
- Confirmation step before payroll or invoice exports (no accidental sends)

---

## 14. Technical Architecture

### Frontend

- **Next.js 15** (React, App Router)
- **Tailwind CSS** — fast iteration, consistent design tokens
- **TypeScript** — all entities typed (`src/types/database.ts`)
- **Lucide React** — icon set
- Component-based UI with reusable layouts, tables, forms, modals

### Backend

- **Next.js API Routes** (`src/app/api/`)
- REST endpoints for all entities
- Business logic layer for:
  - Payroll calculations (`src/lib/utils.ts`)
  - Proration rules
  - CSV generation
  - Permission enforcement

### Database

- **PostgreSQL** via **Supabase**
- UUID primary keys
- Effective-date versioning for pricing
- Indexes on hot paths (employee lookups, document expiry, work entries)
- `updated_at` triggers on mutable tables

### Authentication

- **Google OAuth / Google Workspace SSO**
- **NextAuth.js** for session management
- Role-based access: `admin` | `contractor` (stored in `users.role`)

### File Storage

- **Google Drive** for document storage
- Database stores file IDs and URLs, not files
- Permissions managed via Google Workspace

### Email

- **Gmail API** from company domain
- Payroll notifications
- W-8BEN renewal reminders
- Document upload notifications

### Deployment

- **Vercel** for Next.js hosting
- **Supabase** managed PostgreSQL
- Three environments: dev / staging / production
- Vercel preview deployments for staging

---

## 15. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load (common views) | < 300ms |
| Payroll idempotency | Same inputs → identical outputs, every time |
| Responsive design | Mobile-friendly, not mobile-first |
| Error handling | Clear validation messages, no silent failures |
| Financial data security | Encrypted in transit (TLS), RLS policies in Supabase |
| Audit coverage | All payroll, invoice, and status-change operations logged |
| CSV determinism | Same payroll/invoice run always produces the same CSV |

---

## 16. Scope — MVP vs Later

### MVP (Now)

- Contractor CRUD with client/role assignment
- Client and pricing management
- Pay period creation and management
- Work entry tracking
- Payroll calculation and Veem CSV export
- Client invoicing and QuickBooks CSV export
- Document management with W-8BEN expiry tracking
- Time-off requests and approvals
- Admin dashboard with tables, filters, exports
- Contractor read-only portal
- Google OAuth login
- Audit logging

### Phase 2

- Automated pay period creation (cron)
- Email notifications (payroll, W-8BEN renewal)
- Dark/light mode toggle
- Advanced reports and analytics
- Performance dashboards
- Bulk operations (multi-contractor actions)
- API documentation
- E2E test coverage

---

## 17. Open Questions

None. Payroll logic is locked. UX direction is defined. Tech stack is defined. Build it.
