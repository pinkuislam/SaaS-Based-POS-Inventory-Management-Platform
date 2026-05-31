import { exec } from "child_process";
import { promisify } from "util";
import { createConnection } from "mariadb";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

export function buildTenantDatabaseName(slug: string) {
  const safe = slug.replace(/-/g, "_").replace(/[^a-z0-9_]/gi, "");
  return `inventory_pos_${safe}`;
}

export function buildTenantDatabaseUrl(dbName: string): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(base);
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
}

export async function createTenantDatabase(dbName: string) {
  const config = parseDatabaseUrl(process.env.DATABASE_URL!);
  const conn = await createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conn.end();
  }
}

export async function pushSchemaToTenantDatabase(dbName: string) {
  const url = buildTenantDatabaseUrl(dbName);
  await execAsync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: url },
    cwd: process.cwd(),
  });
}

const tenantClients = new Map<string, PrismaClient>();

export function getTenantPrismaClient(dbName: string): PrismaClient {
  const cached = tenantClients.get(dbName);
  if (cached) return cached;

  const url = buildTenantDatabaseUrl(dbName);
  const config = parseDatabaseUrl(url);
  const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: 5,
  });

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

  tenantClients.set(dbName, client);
  return client;
}

/**
 * Returns dedicated tenant DB client when provisioned, otherwise master prisma (shared DB mode).
 */
export async function getTenantDataClient(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { dbName: true, dbProvisioned: true },
  });

  if (tenant?.dbProvisioned && tenant.dbName) {
    return {
      client: getTenantPrismaClient(tenant.dbName),
      mode: "dedicated" as const,
      tenantId,
    };
  }

  return {
    client: prisma,
    mode: "shared" as const,
    tenantId,
  };
}

export async function provisionTenantDatabase(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  const dbName = tenant.dbName || buildTenantDatabaseName(tenant.slug);

  await createTenantDatabase(dbName);
  await pushSchemaToTenantDatabase(dbName);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      dbName,
      dbProvisioned: true,
    },
  });

  return { dbName, message: "Database provisioned successfully" };
}
