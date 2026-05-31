import { prisma } from "@/lib/prisma";

export interface PaymentGatewayConfig {
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  sslcommerzEnabled: boolean;
  sslcommerzStoreId: string;
  sslcommerzStorePass: string;
  sslcommerzSandbox: boolean;
  defaultGateway: "stripe" | "sslcommerz";
}

const KEYS = {
  stripeEnabled: "payment.stripe.enabled",
  stripePublishableKey: "payment.stripe.publishable_key",
  stripeSecretKey: "payment.stripe.secret_key",
  stripeWebhookSecret: "payment.stripe.webhook_secret",
  sslcommerzEnabled: "payment.sslcommerz.enabled",
  sslcommerzStoreId: "payment.sslcommerz.store_id",
  sslcommerzStorePass: "payment.sslcommerz.store_pass",
  sslcommerzSandbox: "payment.sslcommerz.sandbox",
  defaultGateway: "payment.default_gateway",
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

export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
  const [
    stripeEnabled,
    stripePublishableKey,
    stripeSecretKey,
    stripeWebhookSecret,
    sslcommerzEnabled,
    sslcommerzStoreId,
    sslcommerzStorePass,
    sslcommerzSandbox,
    defaultGateway,
  ] = await Promise.all([
    getSetting(KEYS.stripeEnabled),
    getSetting(KEYS.stripePublishableKey),
    getSetting(KEYS.stripeSecretKey),
    getSetting(KEYS.stripeWebhookSecret),
    getSetting(KEYS.sslcommerzEnabled),
    getSetting(KEYS.sslcommerzStoreId),
    getSetting(KEYS.sslcommerzStorePass),
    getSetting(KEYS.sslcommerzSandbox),
    getSetting(KEYS.defaultGateway),
  ]);

  return {
    stripeEnabled: stripeEnabled === "true",
    stripePublishableKey,
    stripeSecretKey,
    sslcommerzEnabled: sslcommerzEnabled === "true",
    sslcommerzStoreId,
    sslcommerzStorePass,
    sslcommerzSandbox: sslcommerzSandbox !== "false",
    stripeWebhookSecret,
    defaultGateway:
      defaultGateway === "sslcommerz" ? "sslcommerz" : "stripe",
  };
}

export async function savePaymentGatewayConfig(
  config: Partial<PaymentGatewayConfig>
) {
  if (config.stripeEnabled !== undefined) {
    await setSetting(KEYS.stripeEnabled, String(config.stripeEnabled));
  }
  if (config.stripePublishableKey !== undefined) {
    await setSetting(KEYS.stripePublishableKey, config.stripePublishableKey);
  }
  if (config.stripeSecretKey !== undefined) {
    await setSetting(KEYS.stripeSecretKey, config.stripeSecretKey);
  }
  if (config.stripeWebhookSecret !== undefined) {
    await setSetting(KEYS.stripeWebhookSecret, config.stripeWebhookSecret);
  }
  if (config.sslcommerzEnabled !== undefined) {
    await setSetting(KEYS.sslcommerzEnabled, String(config.sslcommerzEnabled));
  }
  if (config.sslcommerzStoreId !== undefined) {
    await setSetting(KEYS.sslcommerzStoreId, config.sslcommerzStoreId);
  }
  if (config.sslcommerzStorePass !== undefined) {
    await setSetting(KEYS.sslcommerzStorePass, config.sslcommerzStorePass);
  }
  if (config.sslcommerzSandbox !== undefined) {
    await setSetting(KEYS.sslcommerzSandbox, String(config.sslcommerzSandbox));
  }
  if (config.defaultGateway !== undefined) {
    await setSetting(KEYS.defaultGateway, config.defaultGateway);
  }
}

/** Public config safe for tenant billing UI */
export async function getPublicPaymentConfig() {
  const config = await getPaymentGatewayConfig();
  return {
    stripeEnabled: config.stripeEnabled && !!config.stripePublishableKey,
    stripePublishableKey: config.stripePublishableKey,
    sslcommerzEnabled: config.sslcommerzEnabled && !!config.sslcommerzStoreId,
    defaultGateway: config.defaultGateway,
  };
}
