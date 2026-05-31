import { execFileSync, spawn } from "child_process";
import { createWriteStream, existsSync, statSync } from "fs";
import { mkdir, readdir } from "fs/promises";
import path from "path";

let cachedMysqldumpPath: string | null | undefined;

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

function isExecutable(filePath: string) {
  return existsSync(filePath);
}

async function findInLaragonBin(): Promise<string | null> {
  const roots = [
    process.env.LARAGON_ROOT,
    process.env.LARAGON_DIR,
    "F:\\laragon",
    "C:\\laragon",
    "D:\\laragon",
  ].filter((r): r is string => !!r && r.length > 0);

  const binNames = ["mysql", "mariadb"];

  for (const root of roots) {
    for (const binName of binNames) {
      const base = path.join(root, "bin", binName);
      if (!existsSync(base)) continue;

      let versions: string[] = [];
      try {
        versions = await readdir(base);
      } catch {
        continue;
      }

      for (const ver of versions) {
        const binDir = path.join(base, ver, "bin");
        for (const name of ["mysqldump.exe", "mariadb-dump.exe", "mysqldump", "mariadb-dump"]) {
          const candidate = path.join(binDir, name);
          if (isExecutable(candidate)) return candidate;
        }
      }
    }
  }

  return null;
}

function findOnSystemPath(): string | null {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    const out = execFileSync(cmd, ["mysqldump"], {
      encoding: "utf8",
      windowsHide: true,
    }).trim();
    const first = out.split(/\r?\n/).find((line) => line.trim().length > 0);
    if (first && isExecutable(first.trim())) return first.trim();
  } catch {
    /* not on PATH */
  }

  if (process.platform === "win32") {
    const programFiles = [
      process.env.ProgramFiles,
      process.env["ProgramFiles(x86)"],
    ].filter(Boolean) as string[];

    for (const pf of programFiles) {
      const guesses = [
        path.join(pf, "MySQL", "MySQL Server 8.0", "bin", "mysqldump.exe"),
        path.join(pf, "MySQL", "MySQL Server 8.4", "bin", "mysqldump.exe"),
        path.join(pf, "MariaDB 10.11", "bin", "mysqldump.exe"),
      ];
      for (const g of guesses) {
        if (isExecutable(g)) return g;
      }
    }
  }

  return null;
}

/** Resolve mysqldump binary (Laragon, PATH, or MYSQLDUMP_PATH). */
export async function resolveMysqldumpBinary(): Promise<string> {
  if (cachedMysqldumpPath !== undefined && cachedMysqldumpPath) {
    return cachedMysqldumpPath;
  }

  const fromEnv = process.env.MYSQLDUMP_PATH?.trim();
  if (fromEnv && isExecutable(fromEnv)) {
    cachedMysqldumpPath = fromEnv;
    return fromEnv;
  }

  const laragon = await findInLaragonBin();
  if (laragon) {
    cachedMysqldumpPath = laragon;
    return laragon;
  }

  const onPath = findOnSystemPath();
  if (onPath) {
    cachedMysqldumpPath = onPath;
    return onPath;
  }

  cachedMysqldumpPath = null;
  throw new Error(
    "mysqldump was not found. On Laragon, add MySQL bin to PATH or set MYSQLDUMP_PATH in .env " +
      '(e.g. MYSQLDUMP_PATH="F:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysqldump.exe").'
  );
}

export async function runMysqldump(
  databaseName: string,
  outputFilePath: string
): Promise<{ sizeBytes: number }> {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error("DATABASE_URL is not set");

  const config = parseDatabaseUrl(baseUrl);
  const mysqldumpBin = await resolveMysqldumpBinary();
  await mkdir(path.dirname(outputFilePath), { recursive: true });

  return new Promise((resolve, reject) => {
    const args = [
      "-h",
      config.host,
      "-P",
      String(config.port),
      "-u",
      config.user,
      "--single-transaction",
      "--routines",
      "--triggers",
      databaseName,
    ];

    const proc = spawn(mysqldumpBin, args, {
      env: { ...process.env, MYSQL_PWD: config.password },
      shell: false,
      windowsHide: true,
    });

    const out = createWriteStream(outputFilePath);
    proc.stdout.pipe(out);

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(
        new Error(
          `Failed to run mysqldump at ${mysqldumpBin}: ${err.message}`
        )
      );
    });

    proc.on("close", (code) => {
      out.end(() => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `mysqldump exited with code ${code}`));
          return;
        }
        try {
          const stat = statSync(outputFilePath);
          if (stat.size === 0) {
            reject(new Error("Backup file is empty. Check database name and credentials."));
            return;
          }
          resolve({ sizeBytes: stat.size });
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Could not read backup file"));
        }
      });
    });
  });
}

export function getBackupDirectory() {
  return path.join(process.cwd(), "storage", "backups");
}
