import "dotenv/config";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLES } from "../src/lib/permissions";
import { prisma } from "../src/lib/db";

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.superAdmin.upsert({
    where: { email: "admin@platform.com" },
    update: {},
    create: {
      email: "admin@platform.com",
      password,
      name: "Super Admin",
    },
  });

  const packages = [
    {
      name: "Starter",
      slug: "starter",
      description: "For small shops - 1 branch, 2 users, basic POS",
      price: 999,
      billingCycle: "monthly",
      trialDays: 14,
      maxUsers: 2,
      maxBranches: 1,
      maxProducts: 500,
      maxInvoices: 1000,
      features: ["POS", "Basic Inventory", "Basic Reports"],
      sortOrder: 1,
    },
    {
      name: "Business",
      slug: "business",
      description: "Growing businesses - multiple branches and users",
      price: 2499,
      billingCycle: "monthly",
      trialDays: 14,
      maxUsers: 10,
      maxBranches: 3,
      maxProducts: 5000,
      maxInvoices: 10000,
      features: [
        "POS",
        "Inventory",
        "Purchase",
        "Sales",
        "Customers",
        "Suppliers",
        "Advanced Reports",
        "Barcode",
      ],
      sortOrder: 2,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Large businesses - unlimited features",
      price: 4999,
      billingCycle: "monthly",
      trialDays: 30,
      maxUsers: 100,
      maxBranches: 20,
      maxProducts: 50000,
      maxInvoices: 100000,
      features: [
        "All Features",
        "E-commerce API",
        "Priority Support",
        "Custom Roles",
      ],
      sortOrder: 3,
    },
  ];

  for (const pkg of packages) {
    await prisma.subscriptionPackage.upsert({
      where: { slug: pkg.slug },
      update: pkg,
      create: pkg,
    });
  }

  const businessPkg = await prisma.subscriptionPackage.findUnique({
    where: { slug: "business" },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-shop" },
    update: {},
    create: {
      name: "Demo Retail Shop",
      slug: "demo-shop",
      email: "owner@demoshop.com",
      phone: "+8801700000000",
      address: "123 Main Street, Dhaka",
      status: "ACTIVE",
      packageId: businessPkg?.id,
    },
  });

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  if (businessPkg) {
    await prisma.subscription.upsert({
      where: { id: "demo-subscription" },
      update: {},
      create: {
        id: "demo-subscription",
        tenantId: tenant.id,
        packageId: businessPkg.id,
        endDate,
        status: "ACTIVE",
        amount: businessPkg.price,
      },
    });
  }

  const branch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "MAIN" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Main Branch",
      code: "MAIN",
      address: "123 Main Street",
      isMain: true,
    },
  });

  for (const [, roleData] of Object.entries(DEFAULT_ROLES)) {
    await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: roleData.name } },
      update: { permissions: roleData.permissions },
      create: {
        tenantId: tenant.id,
        name: roleData.name,
        permissions: roleData.permissions,
        isDefault: roleData.name === "Owner",
      },
    });
  }

  const ownerRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "Owner" } },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: "owner@demoshop.com", tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      roleId: ownerRole?.id,
      branchId: branch.id,
      email: "owner@demoshop.com",
      password,
      name: "Demo Owner",
      userType: "TENANT",
    },
  });

  const cashierRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "Cashier" } },
  });

  await prisma.user.upsert({
    where: {
      email_tenantId: { email: "cashier@demoshop.com", tenantId: tenant.id },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      roleId: cashierRole?.id,
      branchId: branch.id,
      email: "cashier@demoshop.com",
      password,
      name: "Demo Cashier",
      userType: "TENANT",
    },
  });

  const categoryNames = ["Electronics", "Groceries", "Clothing", "Pharmacy"];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.productCategory.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: { tenantId: tenant.id, name },
    });
    categories[name] = cat.id;
  }

  const unit = await prisma.unit.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Piece" } },
    update: {},
    create: { tenantId: tenant.id, name: "Piece", shortName: "pc" },
  });

  const brand = await prisma.brand.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Generic" } },
    update: {},
    create: { tenantId: tenant.id, name: "Generic" },
  });

  const sampleProducts = [
    { name: "Wireless Mouse", sku: "WM-001", barcode: "8901001001001", purchasePrice: 350, sellingPrice: 550, stockQty: 50, category: "Electronics" },
    { name: "USB Keyboard", sku: "KB-002", barcode: "8901001001002", purchasePrice: 450, sellingPrice: 750, stockQty: 30, category: "Electronics" },
    { name: "Rice 5kg", sku: "RC-001", barcode: "8901001002001", purchasePrice: 280, sellingPrice: 350, stockQty: 100, category: "Groceries" },
    { name: "Cooking Oil 1L", sku: "OL-001", barcode: "8901001002002", purchasePrice: 120, sellingPrice: 155, stockQty: 80, category: "Groceries" },
    { name: "T-Shirt M", sku: "TS-M", barcode: "8901001003001", purchasePrice: 200, sellingPrice: 450, stockQty: 25, category: "Clothing" },
    { name: "Paracetamol 500mg", sku: "PAR-500", barcode: "8901001004001", purchasePrice: 2, sellingPrice: 5, stockQty: 200, category: "Pharmacy" },
    { name: "Laptop Stand", sku: "LS-001", barcode: "8901001001003", purchasePrice: 800, sellingPrice: 1200, stockQty: 15, category: "Electronics" },
    { name: "Notebook A5", sku: "NB-A5", barcode: "8901001005001", purchasePrice: 40, sellingPrice: 80, stockQty: 120, category: "Groceries" },
  ];

  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { id: `${tenant.id}-${p.sku}` },
      update: {},
      create: {
        id: `${tenant.id}-${p.sku}`,
        tenantId: tenant.id,
        branchId: branch.id,
        categoryId: categories[p.category],
        brandId: brand.id,
        unitId: unit.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stockQty: p.stockQty,
        reorderLevel: 10,
        taxRate: 0,
      },
    });
  }

  await prisma.customer.upsert({
    where: { id: "demo-customer-1" },
    update: {},
    create: {
      id: "demo-customer-1",
      tenantId: tenant.id,
      name: "Walk-in Customer",
      phone: "0000000000",
      customerType: "retail",
    },
  });

  await prisma.customer.upsert({
    where: { id: "demo-customer-2" },
    update: {},
    create: {
      id: "demo-customer-2",
      tenantId: tenant.id,
      name: "Ahmed Khan",
      phone: "+8801711111111",
      email: "ahmed@example.com",
      customerType: "wholesale",
      creditLimit: 50000,
    },
  });

  await prisma.supplier.upsert({
    where: { id: "demo-supplier-1" },
    update: {},
    create: {
      id: "demo-supplier-1",
      tenantId: tenant.id,
      name: "ABC Distributors",
      companyName: "ABC Trading Ltd",
      phone: "+8801811111111",
      email: "contact@abc.com",
    },
  });

  await prisma.expenseCategory.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Utilities" } },
    update: {},
    create: { tenantId: tenant.id, name: "Utilities" },
  });

  console.log("Seed completed successfully!");
  console.log("Super Admin: admin@platform.com / password123");
  console.log("Tenant Owner: owner@demoshop.com / password123");
  console.log("Cashier: cashier@demoshop.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
