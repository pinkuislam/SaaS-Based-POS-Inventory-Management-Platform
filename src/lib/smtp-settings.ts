import { prisma } from "@/lib/prisma";

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  configured: boolean;
}

const KEYS = {
  enabled: "email.smtp.enabled",
  host: "email.smtp.host",
  port: "email.smtp.port",
  secure: "email.smtp.secure",
  user: "email.smtp.user",
  pass: "email.smtp.pass",
  from: "email.smtp.from",
} as const;

async function getSetting(key: string): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? "";
}

async function setSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

function envFallback(): Omit<SmtpConfig, "configured"> {
  return {
    enabled: true,
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  };
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const [enabled, host, port, secure, user, pass, from] = await Promise.all([
    getSetting(KEYS.enabled),
    getSetting(KEYS.host),
    getSetting(KEYS.port),
    getSetting(KEYS.secure),
    getSetting(KEYS.user),
    getSetting(KEYS.pass),
    getSetting(KEYS.from),
  ]);

  const hasDb = !!(host || user);
  const base = hasDb
    ? {
        enabled: enabled !== "false",
        host,
        port: parseInt(port || "587", 10),
        secure: secure === "true",
        user,
        pass,
        from: from || user,
      }
    : envFallback();

  const configured =
    base.enabled && !!base.host && !!base.user && !!base.pass;

  return { ...base, configured };
}

export async function saveSmtpConfig(
  config: Partial<SmtpConfig> & { pass?: string }
) {
  if (config.enabled !== undefined) {
    await setSetting(KEYS.enabled, String(config.enabled));
  }
  if (config.host !== undefined) await setSetting(KEYS.host, config.host);
  if (config.port !== undefined) await setSetting(KEYS.port, String(config.port));
  if (config.secure !== undefined) {
    await setSetting(KEYS.secure, String(config.secure));
  }
  if (config.user !== undefined) await setSetting(KEYS.user, config.user);
  if (config.pass !== undefined && config.pass) {
    await setSetting(KEYS.pass, config.pass);
  }
  if (config.from !== undefined) await setSetting(KEYS.from, config.from);
}
