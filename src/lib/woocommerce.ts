export interface WooCommerceConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface WooProduct {
  id: number;
  name: string;
  sku: string;
  price: string;
  regular_price: string;
  stock_quantity: number | null;
  manage_stock: boolean;
}

export interface WooOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  billing: { first_name: string; last_name: string; email: string };
  line_items: {
    product_id: number;
    sku: string;
    name: string;
    quantity: number;
    total: string;
  }[];
}

function apiUrl(storeUrl: string, path: string) {
  const base = storeUrl.replace(/\/$/, "");
  return `${base}/wp-json/wc/v3${path}`;
}

function withAuth(url: string, config: WooCommerceConfig) {
  const u = new URL(url);
  u.searchParams.set("consumer_key", config.consumerKey);
  u.searchParams.set("consumer_secret", config.consumerSecret);
  return u.toString();
}

export async function testWooCommerceConnection(
  config: WooCommerceConfig
): Promise<{ ok: boolean; message: string }> {
  try {
    const url = withAuth(
      apiUrl(config.storeUrl, "/products?per_page=1"),
      config
    );
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        message: `HTTP ${res.status}: ${text.slice(0, 120)}`,
      };
    }
    return { ok: true, message: "Connected successfully" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Connection failed",
    };
  }
}

export async function fetchWooProducts(
  config: WooCommerceConfig,
  page = 1
): Promise<WooProduct[]> {
  const url = withAuth(
    apiUrl(config.storeUrl, `/products?per_page=100&page=${page}`),
    config
  );
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`WooCommerce products: HTTP ${res.status}`);
  return res.json();
}

export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing: { phone: string };
}

export async function fetchWooCustomers(
  config: WooCommerceConfig,
  page = 1
): Promise<WooCustomer[]> {
  const url = withAuth(
    apiUrl(config.storeUrl, `/customers?per_page=100&page=${page}`),
    config
  );
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`WooCommerce customers: HTTP ${res.status}`);
  return res.json();
}

export async function fetchWooOrders(
  config: WooCommerceConfig,
  after?: Date
): Promise<WooOrder[]> {
  let path = "/orders?per_page=50&status=completed,processing";
  if (after) {
    path += `&after=${after.toISOString()}`;
  }
  const url = withAuth(apiUrl(config.storeUrl, path), config);
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`WooCommerce orders: HTTP ${res.status}`);
  return res.json();
}
