export const SHOPIFY_API_VERSION = "2024-10";

export interface ShopifyConfig {
  storeUrl: string;
  accessToken: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  variants: {
    id: number;
    sku: string | null;
    price: string;
    inventory_quantity: number | null;
  }[];
}

export interface ShopifyOrder {
  id: number;
  name: string;
  financial_status: string;
  total_price: string;
  created_at: string;
  customer: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  line_items: {
    product_id: number | null;
    variant_id: number | null;
    sku: string | null;
    title: string;
    quantity: number;
    price: string;
  }[];
}

function normalizeStoreUrl(storeUrl: string) {
  let url = storeUrl.trim().replace(/\/$/, "");
  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, "");
}

function adminUrl(storeUrl: string, path: string) {
  const base = normalizeStoreUrl(storeUrl);
  return `${base}/admin/api/${SHOPIFY_API_VERSION}${path}`;
}

async function shopifyFetch(
  config: ShopifyConfig,
  path: string,
  init?: RequestInit
) {
  const url = adminUrl(config.storeUrl, path);
  const res = await fetch(url, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": config.accessToken,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(30000),
  });
  return res;
}

export function shopifyConfigFromSetting(setting: {
  storeUrl: string;
  consumerKey: string;
}): ShopifyConfig {
  return {
    storeUrl: setting.storeUrl,
    accessToken: setting.consumerKey,
  };
}

export async function testShopifyConnection(
  config: ShopifyConfig
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await shopifyFetch(config, "/shop.json", {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        message: `HTTP ${res.status}: ${text.slice(0, 120)}`,
      };
    }
    const data = (await res.json()) as { shop?: { name?: string } };
    const name = data.shop?.name || "Shop";
    return { ok: true, message: `Connected to ${name}` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Connection failed",
    };
  }
}

export async function fetchShopifyProducts(
  config: ShopifyConfig,
  pageInfo?: string
): Promise<{ products: ShopifyProduct[]; nextPageInfo: string | null }> {
  const path = pageInfo
    ? `/products.json?limit=100&page_info=${encodeURIComponent(pageInfo)}`
    : "/products.json?limit=100";
  const res = await shopifyFetch(config, path);
  if (!res.ok) throw new Error(`Shopify products: HTTP ${res.status}`);

  const data = (await res.json()) as { products: ShopifyProduct[] };
  const link = res.headers.get("link");
  let nextPageInfo: string | null = null;
  if (link?.includes('rel="next"')) {
    const match = link.match(/page_info=([^>&]+)/);
    if (match) nextPageInfo = decodeURIComponent(match[1]);
  }

  return { products: data.products || [], nextPageInfo };
}

export async function fetchAllShopifyProducts(
  config: ShopifyConfig,
  maxPages = 10
): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let pageInfo: string | undefined;
  let page = 0;

  while (page < maxPages) {
    const { products, nextPageInfo } = await fetchShopifyProducts(
      config,
      pageInfo
    );
    all.push(...products);
    if (!nextPageInfo || products.length === 0) break;
    pageInfo = nextPageInfo;
    page++;
  }

  return all;
}

export async function fetchShopifyOrders(
  config: ShopifyConfig,
  createdAtMin?: Date
): Promise<ShopifyOrder[]> {
  let path =
    "/orders.json?limit=50&status=any&financial_status=paid,partially_paid";
  if (createdAtMin) {
    path += `&created_at_min=${encodeURIComponent(createdAtMin.toISOString())}`;
  }
  const res = await shopifyFetch(config, path);
  if (!res.ok) throw new Error(`Shopify orders: HTTP ${res.status}`);
  const data = (await res.json()) as { orders: ShopifyOrder[] };
  return data.orders || [];
}
