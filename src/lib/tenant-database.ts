import { execFile } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { promisify } from "util";
import { createConnection } from "mariadb";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

function getPrismaCliPath(): string {
  return path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
}

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

export async function tenantDatabaseExists(dbName: string): Promise<boolean> {
  const config = parseDatabaseUrl(process.env.DATABASE_URL!);
  const conn = await createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });
  try {
    const rows = (await conn.query(
      "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
      [dbName]
    )) as { SCHEMA_NAME: string }[];
    return rows.length > 0;
  } finally {
    await conn.end();
  }
}

export async function dropTenantDatabase(dbName: string) {
  const config = parseDatabaseUrl(process.env.DATABASE_URL!);
  const conn = await createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  } finally {
    await conn.end();
  }
}

export async function tenantDatabaseHasTables(dbName: string): Promise<boolean> {
  const config = parseDatabaseUrl(process.env.DATABASE_URL!);
  const conn = await createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });
  try {
    const rows = (await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbName]
    )) as { c: number }[];
    return Number(rows[0]?.c ?? 0) > 0;
  } finally {
    await conn.end();
  }
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

function execErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as {
      stderr?: string;
      stdout?: string;
      message?: string;
      code?: string;
    };
    if (e.code === "EINVAL") {
      return "Could not start Prisma CLI on this system. Restart the dev server and try again.";
    }
    const raw = [e.stderr, e.stdout, e.message].filter(Boolean).join("\n");
    if (/disk is full|ENOSPC|not enough space/i.test(raw)) {
      return (
        "MySQL could not create tables because the server disk is full. " +
        "Free space on drive F: (delete old files in storage/backups, empty Recycle Bin, remove .next folder), " +
        "restart Laragon/MySQL, then click Provision again."
      );
    }
    if (raw) {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(
          (l) =>
            l &&
            !l.startsWith("Usage") &&
            !l.startsWith("Push the state") &&
            !l.startsWith("Options") &&
            !l.includes("schema-engine\\") &&
            !l.includes("apply_migration.rs")
        );
      const msg = lines.find((l) => l.startsWith("Error:")) || lines.slice(-3).join(" ");
      if (msg) return msg.replace(/^Error:\s*/i, "").slice(0, 500);
      return lines.slice(-5).join(" ") || raw.slice(0, 400);
    }
  }
  return "Failed to apply schema to tenant database";
}

export async function pushSchemaToTenantDatabase(dbName: string) {
  const url = buildTenantDatabaseUrl(dbName);
  const prismaCli = getPrismaCliPath();

  if (!existsSync(prismaCli)) {
    throw new Error(
      "Prisma CLI not found. Run npm install in the project root first."
    );
  }

  try {
    // Run via node.exe — avoids Windows spawn EINVAL from npx.cmd / execFile
    await execFileAsync(
      process.execPath,
      [
        prismaCli,
        "db",
        "push",
        "--url",
        url,
        "--accept-data-loss",
      ],
      {
        cwd: process.cwd(),
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      }
    );
  } catch (error) {
    throw new Error(execErrorMessage(error));
  }
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

  const exists = await tenantDatabaseExists(dbName);
  const hasTables = exists ? await tenantDatabaseHasTables(dbName) : false;

  // Recover from a previous failed provision (empty/partial schema)
  if (exists && hasTables && !tenant.dbProvisioned) {
    await dropTenantDatabase(dbName);
  }

  if (!(await tenantDatabaseExists(dbName))) {
    await createTenantDatabase(dbName);
  }

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
