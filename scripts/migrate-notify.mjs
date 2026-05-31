import fs from "fs";
import path from "path";

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(tsx?)$/.test(ent.name) && !p.includes("notify.ts") && !p.includes("sonner.tsx")) {
      let c = fs.readFileSync(p, "utf8");
      const o = c;
      if (c.includes('from "sonner"') || c.includes("from 'sonner'")) {
        c = c.replace(
          /import\s*\{\s*toast\s*\}\s*from\s*["']sonner["']/g,
          'import { notify } from "@/lib/notify"'
        );
        c = c.replace(/toast\.success/g, "notify.success");
        c = c.replace(/toast\.error/g, "notify.error");
        c = c.replace(/toast\.warning/g, "notify.warning");
        c = c.replace(/toast\.info/g, "notify.info");
        c = c.replace(/toast\.loading/g, "notify.loading");
        c = c.replace(/toast\.dismiss/g, "notify.dismiss");
        c = c.replace(/toast\.promise/g, "notify.promise");
      }
      if (c !== o) fs.writeFileSync(p, c);
    }
  }
}

walk("src");
console.log("notify migration done");
