import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd());

const targets = [
  {
    file: "apps/admin-portal/src/lib/supabase.ts",
    kind: "vite",
  },
  {
    file: "apps/rm-portal/src/lib/supabase.ts",
    kind: "vite",
  },
  {
    file: "apps/client-website/lib/supabase.ts",
    kind: "next",
  },
];

function ensureFileExists(filePath) {
  const abs = path.join(repoRoot, filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  return abs;
}

function extractQuotedConstValue(source, constName) {
  const re = new RegExp(
    String.raw`export const ${constName}\s*=\s*"([^"]+)";`,
    "m",
  );
  const m = source.match(re);
  return m?.[1] ?? null;
}

function alreadyEnvBased(source) {
  return (
    source.includes("import.meta.env.VITE_SUPABASE_URL") ||
    source.includes("import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY") ||
    source.includes("process.env.NEXT_PUBLIC_SUPABASE_URL") ||
    source.includes("process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

function replaceConstLine(source, constName, newRhs) {
  const re = new RegExp(
    String.raw`^export const ${constName}\s*=\s*.+?;\s*$`,
    "m",
  );
  if (!re.test(source)) return { ok: false, next: source };
  return { ok: true, next: source.replace(re, `export const ${constName} = ${newRhs};`) };
}

function updateSupabaseFile({ absPath, relPath, kind }) {
  const original = fs.readFileSync(absPath, "utf8");

  if (alreadyEnvBased(original)) {
    return { relPath, changed: false, reason: "already env-based" };
  }

  const url = extractQuotedConstValue(original, "SUPABASE_URL");
  const key = extractQuotedConstValue(original, "SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    throw new Error(
      `Could not find hardcoded SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY in ${relPath}`,
    );
  }

  const urlRhs =
    kind === "vite"
      ? `import.meta.env.VITE_SUPABASE_URL ?? "${url}"`
      : `process.env.NEXT_PUBLIC_SUPABASE_URL ?? "${url}"`;

  const keyRhs =
    kind === "vite"
      ? `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "${key}"`
      : `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "${key}"`;

  let next = original;

  const r1 = replaceConstLine(next, "SUPABASE_URL", urlRhs);
  next = r1.next;
  const r2 = replaceConstLine(next, "SUPABASE_PUBLISHABLE_KEY", keyRhs);
  next = r2.next;

  if (!r1.ok || !r2.ok) {
    throw new Error(`Failed to rewrite SUPABASE_* constants in ${relPath}`);
  }

  if (next === original) {
    return { relPath, changed: false, reason: "no changes" };
  }

  fs.writeFileSync(absPath, next, "utf8");
  return { relPath, changed: true };
}

function main() {
  const results = [];

  for (const target of targets) {
    const absPath = ensureFileExists(target.file);
    results.push(
      updateSupabaseFile({
        absPath,
        relPath: target.file,
        kind: target.kind,
      }),
    );
  }

  const changed = results.filter((r) => r.changed);
  const unchanged = results.filter((r) => !r.changed);

  process.stdout.write(
    [
      "Supabase frontend switch: hardcoded → env (with fallback)\n",
      ...changed.map((r) => `- updated ${r.relPath}`),
      ...unchanged.map((r) => `- skipped ${r.relPath} (${r.reason})`),
      "",
      "Next steps:",
      "- Ensure each app's .env(.local) has the correct Supabase URL + publishable key.",
      "- Restart dev servers so the env values are picked up.",
      "",
    ].join("\n"),
  );
}

main();

