# InventoryPOS - SaaS POS & Inventory Management Platform

A cloud-based multi-tenant SaaS platform for POS, billing, inventory, purchases, sales, customers, suppliers, and business reports. Built with **Next.js 16**, **Prisma 7**, **MySQL**, **NextAuth**, and **shadcn/ui**.

Based on the project requirements document in `docs/SaaS-Based POS & Inventory Management Platform.txt`.

**Requirements audit:** see [`docs/REQUIREMENTS-CHECKLIST.md`](docs/REQUIREMENTS-CHECKLIST.md) for full doc §4 mapping (✅ / ⚠️ / ❌).

## Features (MVP)

### Super Admin Panel (`/admin/dashboard`)

**Sign in:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login) (separate from business login at `/login`).
- Platform dashboard with tenant overview (MRR, charts)
- Tenant management (approve pending, activate, suspend, expire)
- Subscription package CRUD
- Subscription tracking & payment history
- Support ticket management (status updates)
- System settings

### Tenant Business Panel

- Dashboard home: `http://localhost:3000/demo-shop/dashboard`
- Other modules: `http://localhost:3000/demo-shop/pos`, `/demo-shop/products`, etc.

`/demo-shop` redirects to `/demo-shop/dashboard`. Legacy `/dashboard` URLs still work.
- Business dashboard with sales analytics
- **POS** - Fast POS with hold/resume, split payment, daily summary, due sales
- **Products** - Catalog, edit, CSV import/export, barcode labels
- **Inventory** - Stock levels, low stock alerts, movement history
- **Sales** - Invoice history
- **Purchases** - Create orders, print invoice, returns, supplier dues
- **Categories** - Manage categories, brands, and units
- **Stock adjustment** - Manual add/remove stock with audit trail
- **Sales returns** - Full or partial returns with stock restoration
- **Expense tracking** - Record expenses with categories
- **Invoice print** - View and print sales receipts
- **Due sales** - Partial payment at POS, collect dues later
- **Customer payments** - Record payments against due invoices
- **Purchase returns** - Full/partial returns with stock reduction
- **Due collection** - Overview of customer & supplier balances
- **Subdomain routing** - Access tenant via `{slug}.localhost:3000`
- **Supplier payments** - Pay supplier dues against purchase invoices
- **Add users & branches** - Team invites with plan limits
- **Branch stock transfer** - Move stock between branches
- **PDF reports** - Export sales, purchases, or stock reports
- **Low stock alerts** - In-app notifications with bell icon
- **Barcode labels** - Print CODE128 labels from products list
- **Role permissions editor** - Customize role access per module
- **Super Admin analytics** - MRR, tenant growth, package breakdown charts
- **Customers** & **Suppliers** management
- **Expenses** tracking
- **Reports** - Date filters, PDF + CSV export, profit & loss report
- **Users & Roles** - RBAC with Owner, Manager, Cashier, etc.
- **Branches** - Multi-branch support
- **Settings** - Business profile, POS settings, billing (Stripe/SSLCommerz), login history, SMTP alerts, support tickets
- **Forgot password** - `/forgot-password` and `/reset-password` (SMTP when configured)
- **Customer/supplier statements** - JSON export from detail pages
- **Extended reports** - Low stock, product/user/branch sales, tax, returns, dues, expiry
- **Activity log** - Audit trail of sales, purchases, product updates
- **Integrations** - WooCommerce connect, product/order sync, online orders list

### SaaS Foundation
- Tenant registration (pending Super Admin approval)
- Subscription packages (Starter, Business, Enterprise)
- Subscription expiry cron (`GET /api/cron/subscriptions`)
- Role-based permissions (routes + APIs)
- JWT authentication via NextAuth v5

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| UI | shadcn/ui, Lucide icons, Recharts |
| Backend | Next.js API Routes, Server Components |
| Database | MySQL (Laragon), Prisma ORM 7 |
| Auth | NextAuth.js v5 (Credentials) |
| State | Zustand (POS cart) |

## Getting Started

### Prerequisites
- Node.js 20+
- MySQL (Laragon recommended on Windows)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit DATABASE_URL and AUTH_SECRET in .env

# Create database and push schema
npm run db:push

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Tenant subdomain (local):** [http://demo-shop.localhost:3000](http://demo-shop.localhost:3000)  
Sign in with `owner@demoshop.com` — the slug must match the tenant account.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@platform.com | password123 |
| Business Owner | owner@demoshop.com | password123 |
| Cashier | cashier@demoshop.com | password123 |

## Database

The MVP uses a **single MySQL database** with `tenantId` on all tenant tables for simplicity. The schema is designed to support migration to **separate databases per tenant** as described in the requirements document.

### Key Tables
- **Master/SaaS**: `Tenant`, `SubscriptionPackage`, `Subscription`, `SuperAdmin`
- **Tenant**: `User`, `Role`, `Product`, `Sale`, `Purchase`, `Customer`, `Supplier`, `Branch`, `StockMovement`, `Expense`

## Project Structure

```
src/
├── app/
│   ├── admin/          # Super Admin panel
│   ├── dashboard/      # Tenant business panel
│   ├── api/            # REST API routes
│   ├── login/
│   └── register/
├── components/         # UI components
├── lib/                # Utilities, Prisma, auth helpers
└── stores/             # Zustand stores (POS)
prisma/
├── schema.prisma
└── seed.ts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Subscription Expiry Cron

Schedule daily (Task Scheduler, cron, or Uptime Robot):

```bash
curl -H "x-cron-secret: YOUR_CRON_SECRET" http://localhost:3000/api/cron/subscriptions
```

Set `CRON_SECRET` in `.env`.

## Subscription Payments (Stripe & SSLCommerz)

**Super Admin** → `/admin/settings` — enable gateways and save API keys.

**Tenant** → Settings → **Pay / Renew Subscription** (or `/demo-shop/settings/billing`).

| Gateway | Currency | Notes |
|---------|----------|--------|
| Stripe | USD | Webhook: `{NEXTAUTH_URL}/api/webhooks/stripe` |
| SSLCommerz | BDT | Sandbox toggle in admin settings |

## Separate Database Per Tenant

Super Admin → **Tenants** → **Provision DB** creates `inventory_pos_{slug}` on the same MySQL server and runs `prisma db push`.

- Master DB keeps SaaS tables; dedicated DB is ready for isolated tenant data.
- Default mode remains **shared DB** with `tenantId` until provisioned.
- Use `getTenantDataClient(tenantId)` from `@/lib/tenant-database` when routing queries to dedicated DBs.

## Thermal Receipt Printing

After POS checkout, the app opens the **80mm thermal** receipt view. From any sale: **Thermal Receipt (80mm)** → Print (CSS `@page size: 80mm` for ESC/POS-style printers).

## WooCommerce Integration

1. Go to **Dashboard → Integrations**
2. Enter store URL + REST API keys (WooCommerce → Settings → Advanced → REST API)
3. **Test Connection** → **Sync Products** / **Sync Orders**

Online orders import as POS sales and reduce stock automatically.

## Future Enhancements (per requirements doc)

- Shopify integration
- Separate database per tenant (schema has `dbName` field)
- Payment gateway (Stripe, SSLCommerz)
- Thermal receipt printing
- Mobile POS app & offline mode
- Loyalty, SMS, AI analytics

## License

Private - All rights reserved.
