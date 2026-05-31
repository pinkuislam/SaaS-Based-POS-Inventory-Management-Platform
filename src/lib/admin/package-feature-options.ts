export type PlatformFeatureOption = {
  value: string;
  label: string;
  module: string;
};

export function toPlatformFeatureOptions(
  features: { key: string; name: string; module: string }[]
): PlatformFeatureOption[] {
  return features.map((f) => ({
    value: f.key,
    label: f.module ? `${f.name} (${f.module})` : f.name,
    module: f.module,
  }));
}

/** Map stored package feature strings (keys or legacy labels) to catalog keys. */
export function resolvePackageFeatureKeys(
  stored: string[],
  catalog: { key: string; name: string }[]
): string[] {
  const keys = new Set<string>();
  for (const item of stored) {
    const s = item.trim();
    if (!s) continue;
    const byKey = catalog.find((c) => c.key === s);
    if (byKey) {
      keys.add(byKey.key);
      continue;
    }
    const byName = catalog.find(
      (c) => c.name.toLowerCase() === s.toLowerCase()
    );
    if (byName) {
      keys.add(byName.key);
      continue;
    }
    keys.add(s);
  }
  return [...keys];
}

export function mergeFeatureOptions(
  catalog: PlatformFeatureOption[],
  selectedKeys: string[]
): PlatformFeatureOption[] {
  const known = new Set(catalog.map((c) => c.value));
  const extras = selectedKeys
    .filter((k) => k && !known.has(k))
    .map((k) => ({
      value: k,
      label: k,
      module: "Legacy",
    }));
  return extras.length ? [...catalog, ...extras] : catalog;
}

export function featureKeysToDisplayLabels(
  stored: string[],
  catalog: { key: string; name: string }[]
): string[] {
  return stored.map((item) => {
    const byKey = catalog.find((c) => c.key === item);
    if (byKey) return byKey.name;
    const byName = catalog.find(
      (c) => c.name.toLowerCase() === item.toLowerCase()
    );
    if (byName) return byName.name;
    return item;
  });
}
