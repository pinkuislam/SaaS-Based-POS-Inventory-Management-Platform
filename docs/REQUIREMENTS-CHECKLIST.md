# Requirements Checklist

Mapped from `docs/SaaS-Based POS & Inventory Management Platform.txt` to the current codebase.

**Legend:** ✅ Implemented · ⚠️ Partial · ❌ Not implemented / future phase

---

## 3. User Types

| Role | Status | Notes |
|------|--------|-------|
| Super Admin | ✅ | `/admin` — tenants, packages, subscriptions, payments, support, settings |
| Business Owner | ✅ | Full permissions via Owner role |
| Branch Manager | ⚠️ | Branch-scoped dashboard via `branch-scope.ts` |
| Cashier | ✅ | POS, own sales list (no `view_reports`), customers |
| Inventory Manager | ✅ | Default `inventory` role |
| Accountant | ✅ | Default `accountant` role |

---

## 4.1 Multi-Tenant SaaS

| Feature | Status | Location |
|---------|--------|----------|
| Master DB (tenants, packages, subscriptions) | ✅ | `prisma/schema.prisma` |
| Tenant registration (pending approval) | ✅ | `/register`, `POST /api/register` |
| Subdomain / slug routing | ✅ | Middleware + login slug |
| Tenant activate / suspend | ✅ | Admin tenant actions |
| Separate DB per tenant | ⚠️ | Provision API + `getTenantDataClient()`; most routes use shared DB + `tenantId` |
| Auto DB on approval | ⚠️ | `AUTO_PROVISION_TENANT_DB` env flag |
| Tenant deletion | ✅ | Admin → Delete tenant (cascade); demo-shop protected |
| Backup / restore UI | ❌ | Future |

---

## 4.2 Authentication & Security

| Feature | Status | Location |
|---------|--------|----------|
| Login (tenant + super admin) | ✅ | `/login`, `src/auth.ts` |
| JWT session | ✅ | NextAuth v5 |
| RBAC permissions | ✅ | `src/lib/permissions.ts`, role editor |
| Forgot / reset password | ✅ | `/forgot-password`, `/reset-password`; email via SMTP (`sendPasswordResetEmail`) |
| Login history | ✅ | `LoginLog`, `/dashboard/settings/security` |
| Activity log | ✅ | `/dashboard/activity` |
| 2FA | ❌ | Future |

---

## 4.3 Super Admin

| Feature | Status | Location |
|---------|--------|----------|
| Tenant management | ✅ | `/admin/tenants` |
| Package CRUD + limits + grace days | ✅ | `/admin/packages`, `graceDays` |
| Change tenant package | ✅ | `TenantPackageDialog`, `PATCH .../package` |
| Subscriptions view | ✅ | `/admin/subscriptions` |
| Payments view | ✅ | `/admin/payments` |
| Support tickets | ✅ | `/admin/support` |
| Payment gateways (Stripe / SSLCommerz) | ✅ | `/admin/settings` |
| Platform analytics dashboard | ✅ | `/admin` — MRR, charts, expiring subs |
| Invoice management (platform) | ✅ | `/admin/billing` — checkout sessions |
| Feature flags per package | ✅ | `package-features.ts` — ecommerce, advanced reports |

---

## 4.4 Tenant / Business Settings

| Feature | Status | Location |
|---------|--------|----------|
| Business profile | ✅ | `TenantProfileForm`, `PATCH /api/tenant/profile` |
| POS settings (tax, receipt footer, etc.) | ✅ | `Tenant.settings` JSON |
| Branches | ✅ | `/dashboard/branches` |
| Users & roles | ✅ | `/dashboard/users` |
| Subscription / billing | ✅ | `/dashboard/settings/billing`, Stripe + SSLCommerz |
| Package limits (users, branches, products, invoices) | ✅ | `src/lib/package-limits.ts` |
| Grace period after expiry | ✅ | `graceDays`, `subscription-expiry.ts`, cron |

---

## 4.5 Products & Inventory

| Feature | Status | Location |
|---------|--------|----------|
| Products CRUD | ✅ | `/dashboard/products` |
| Categories | ✅ | `/dashboard/categories` |
| Barcode / SKU search | ✅ | POS + product search API |
| Stock adjustments | ✅ | `stock-adjust-dialog` (add / damage remove) |
| Stock transfer | ✅ | `POST /api/inventory/transfer` |
| Low stock alerts | ✅ | Dashboard + notifications |
| Import / export CSV | ✅ | Product import/export APIs |
| Barcode label print | ✅ | Product labels |
| Expiry / batch fields | ✅ | Product add/edit forms + expiry report |
| Product images upload | ✅ | `POST /api/products/[id]/image`, edit dialog |
| Opening stock | ⚠️ | Via purchase or adjust |

---

## 4.6 Purchases & Suppliers

| Feature | Status | Location |
|---------|--------|----------|
| Suppliers CRUD | ✅ | `/dashboard/suppliers` |
| Purchases + due | ✅ | `/dashboard/purchases` |
| Supplier payments | ✅ | Supplier detail + API |
| Purchase returns | ✅ | `POST /api/purchases/[id]/return` |
| Supplier statement export | ✅ | Statement API + download button |

---

## 4.7 Sales, POS & Customers

| Feature | Status | Location |
|---------|--------|----------|
| POS (search, cart, tax, discount) | ✅ | `/dashboard/pos` |
| Hold / resume sale | ✅ | Hold API |
| Split payment | ✅ | POS |
| Due sales | ✅ | Due page + customer payments |
| Sales list & detail | ✅ | `/dashboard/sales` |
| Returns (full / partial) + reason | ✅ | Return dialog + activity log |
| Thermal + A4 receipt | ✅ | Thermal component + print |
| Customers CRUD + due collection | ✅ | `/dashboard/customers` |
| Customer statement | ✅ | API + export button |
| Sales exchange module | ✅ | `SaleExchangeDialog`, `POST .../exchange` |
| Manual sales (non-POS) | ✅ | `/dashboard/sales/manual` |
| Customer groups | ✅ | `CustomerGroup`, groups panel, assign on customer |
| Customer opening balance / type | ✅ | Customer form + API |
| Loyalty points | ✅ | Settings, earn on sale, redeem on customer detail |

---

## 4.8 Expenses

| Feature | Status | Location |
|---------|--------|----------|
| Expense categories & entries | ✅ | `/dashboard/expenses` |
| Expense report export | ✅ | Reports hub → Expense Report |

---

## 4.9 Reports & Analytics

| Feature | Status | Location |
|---------|--------|----------|
| Sales, purchases, stock, P&L | ✅ | Reports hub + export API |
| Low stock, product/user/branch sales | ✅ | `src/lib/reports.ts` |
| Payment methods, tax, returns | ✅ | Export types |
| Customer / supplier due, expiry | ✅ | Export types |
| CSV / PDF export | ✅ | `ReportExport` |
| Dashboard charts + top products | ✅ | `/dashboard` |
| Branch/user/customer/supplier filters | ✅ | Report export UI + API query params |

---

## 4.10 Integrations & E-Commerce

| Feature | Status | Location |
|---------|--------|----------|
| WooCommerce connect + sync | ✅ | `/dashboard/integrations` |
| Online orders inbox | ✅ | Integrations orders API |
| Shopify | ❌ | Future |
| REST API for third parties | ✅ | `/api/v1/products`, `/api/v1/sales`, API keys in Settings |
| Separate ecommerce DB tables | ⚠️ | `EcommerceSetting`, `OnlineOrder` |

---

## 4.11 Notifications

| Feature | Status | Location |
|---------|--------|----------|
| In-app notifications | ✅ | `/dashboard/notifications` |
| Low stock / subscription expiry | ✅ | Cron + notification creation |
| Email (SMTP) | ⚠️ | When `SMTP_*` configured |

---

## 4.12 Support

| Feature | Status | Location |
|---------|--------|----------|
| Tenant support tickets | ✅ | Settings form |
| Admin ticket management | ✅ | `/admin/support` |

---

## 5–8. Non-Functional & Roadmap

| Item | Status |
|------|--------|
| Responsive web UI (shadcn) | ✅ |
| Mobile app / offline POS | ⚠️ | PWA manifest (`/manifest.json`); full offline TBD |
| API rate limiting | ✅ | `/api/v1/*` — 120 req/min per key |
| Multi-currency | ⚠️ | Single currency display |
| Multi-language | ❌ |
| API rate limiting | ❌ |
| Automated tenant backups | ❌ |

---

## Quick Test Paths

1. **Super Admin:** `admin@platform.com` / `password123` → `/admin/tenants`
2. **Owner:** `owner@demoshop.com` / `password123` (slug `demo-shop`) → dashboard, POS, reports
3. **Cashier:** `cashier@demoshop.com` / `password123` → POS + own sales only
4. **Billing:** `/dashboard/settings/billing` (configure gateways in admin first)
5. **Forgot password:** `/forgot-password`

---

*Last updated: full requirements audit pass — core MVP + Phase 8 billing/DB/thermal complete; items marked ❌ are explicitly out of scope for current release.*
