import fs from "fs";
import path from "path";

const root = "src/app/[tenant]/dashboard";

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (e.name.endsWith(".tsx")) files.push(p);
  }
  return files;
}

for (const file of walk(root)) {
  if (file.endsWith("layout.tsx")) continue;

  let c = fs.readFileSync(file, "utf8");
  if (!c.includes("/dashboard")) continue;

  if (!c.includes("tenantDashboardPath")) {
    if (c.includes('from "@/lib/tenant"')) {
      c = c.replace(
        /import \{([^}]+)\} from "@\/lib\/tenant";/,
        (_, inner) => {
          const names = inner.split(",").map((s) => s.trim());
          if (!names.includes("getTenantSlug")) names.push("getTenantSlug");
          return `import { ${names.join(", ")} } from "@/lib/tenant";\nimport { tenantDashboardPath } from "@/lib/tenant-path";`;
        }
      );
    } else {
      const lineEnd = c.indexOf("\n", c.indexOf("import "));
      c =
        c.slice(0, lineEnd + 1) +
        'import { getTenantSlug } from "@/lib/tenant";\nimport { tenantDashboardPath } from "@/lib/tenant-path";\n' +
        c.slice(lineEnd + 1);
    }
  }

  if (!c.includes("const tenant = await getTenantSlug()")) {
    if (c.includes("const tenantId = await getTenantId()")) {
      c = c.replace(
        /const tenantId = await getTenantId\(\);\n/,
        "const tenantId = await getTenantId();\n  const tenant = await getTenantSlug();\n"
      );
    } else if (c.match(/export default async function/)) {
      c = c.replace(
        /export default async function[^{]+\{\n/,
        (m) => m + "  const tenant = await getTenantSlug();\n"
      );
    }
  }

  c = c.replace(
    /href="\/dashboard([^"]*)"/g,
    (_, sub) => `href={tenantDashboardPath(tenant, "${sub}")}`
  );

  c = c.replace(
    /href=\{\`\/dashboard([^`]*)\`\}/g,
    (_, sub) => `href={tenantDashboardPath(tenant, \`${sub}\`)}`
  );

  fs.writeFileSync(file, c);
  console.log("updated", file);
}
