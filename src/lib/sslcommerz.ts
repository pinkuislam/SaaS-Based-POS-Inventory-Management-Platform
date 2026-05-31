import { getPaymentGatewayConfig } from "@/lib/payment-settings";

const SANDBOX = "https://sandbox.sslcommerz.com";
const LIVE = "https://securepay.sslcommerz.com";

export async function createSslcommerzSession(params: {
  tranId: string;
  amount: number;
  currency: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}) {
  const config = await getPaymentGatewayConfig();
  if (!config.sslcommerzEnabled || !config.sslcommerzStoreId) {
    throw new Error("SSLCommerz is not configured");
  }

  const base = config.sslcommerzSandbox ? SANDBOX : LIVE;
  const body = new URLSearchParams({
    store_id: config.sslcommerzStoreId,
    store_passwd: config.sslcommerzStorePass,
    total_amount: params.amount.toFixed(2),
    currency: params.currency,
    tran_id: params.tranId,
    success_url: params.successUrl,
    fail_url: params.failUrl,
    cancel_url: params.cancelUrl,
    ipn_url: params.ipnUrl,
    product_name: params.productName,
    product_category: "SaaS Subscription",
    product_profile: "general",
    cus_name: params.customerName,
    cus_email: params.customerEmail,
    cus_phone: params.customerPhone,
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    num_of_item: "1",
  });

  const res = await fetch(`${base}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.status !== "SUCCESS" || !data.GatewayPageURL) {
    throw new Error(data.failedreason || "SSLCommerz session failed");
  }

  return { gatewayUrl: data.GatewayPageURL as string, sessionkey: data.sessionkey };
}

export async function validateSslcommerzPayment(valId: string) {
  const config = await getPaymentGatewayConfig();
  const base = config.sslcommerzSandbox ? SANDBOX : LIVE;
  const qs = new URLSearchParams({
    val_id: valId,
    store_id: config.sslcommerzStoreId,
    store_passwd: config.sslcommerzStorePass,
    format: "json",
  });

  const res = await fetch(
    `${base}/validator/api/validationserverAPI.php?${qs.toString()}`
  );
  return res.json();
}
