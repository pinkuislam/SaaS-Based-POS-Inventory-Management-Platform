# InventoryPOS - SaaS POS & Inventory Management Platform

A cloud-based multi-tenant SaaS platform for POS, billing, inventory, purchases, sales, customers, suppliers, and business reports. Built with **Next.js 16**, **Prisma 7**, **MySQL**, **NextAuth**, and **shadcn/ui**.

Based on the project requirements document in `docs/SaaS-Based POS & Inventory Management Platform.txt`.

## Features (MVP)

### Super Admin Panel (`/admin`)
- Platform dashboard with tenant overview
- Tenant management (activate, suspend, expire)
- Subscription package management
- Subscription tracking
- Support tickets view

### Tenant Business Panel (`/dashboard`)
- Business dashboard with sales analytics
- **POS** - Fast point of sale with barcode/search, cart, payments
- **Products** - Product catalog with categories, brands, units
- **Inventory** - Stock levels, low stock alerts, movement history
- **Sales** - Invoice history
- **Purchases** - Create purchase orders, auto stock increase, supplier dues
- **Categories** - Manage categories, brands, and units
- **Stock adjustment** - Manual add/remove stock with audit trail
- **Sales returns** - Full or partial returns with stock restoration
- **Expense tracking** - Record expenses with categories
- **Invoice print** - View and print sales receipts
- **Customers** & **Suppliers** management
- **Expenses** tracking
- **Reports** - Monthly sales, purchases, profit estimates
- **Users & Roles** - RBAC with Owner, Manager, Cashier, etc.
- **Branches** - Multi-branch support
- **Settings** - Business profile and subscription info

### SaaS Foundation
- Tenant registration with package selection
- Subscription packages (Starter, Business, Enterprise)
- Role-based permissions per tenant
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

## Future Enhancements

Per the requirements document, these can be added in later phases:
- E-commerce integration (WooCommerce, Shopify)
- Separate database per tenant
- Subdomain-based tenant routing
- Payment gateway (Stripe, SSLCommerz)
- PDF/Excel report export
- Thermal receipt printing
- Mobile POS app
- Offline mode

## License

Private - All rights reserved.
