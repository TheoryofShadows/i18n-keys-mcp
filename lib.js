/**
 * i18n locale key comparison — local JSON/YAML files only.
 */
import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

/**
 * Flatten nested object keys with dot notation.
 * @param {unknown} obj
 * @param {string} [prefix]
 * @returns {Record<string, unknown>}
 */
export function flattenKeys(obj, prefix = "") {
  /** @type {Record<string, unknown>} */
  const out = {};
  if (obj === null || obj === undefined) {
    if (prefix) out[prefix] = obj;
    return out;
  }
  if (typeof obj !== "object" || Array.isArray(obj)) {
    if (prefix) out[prefix] = obj;
    return out;
  }
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    if (prefix) out[prefix] = obj;
    return out;
  }
  for (const [k, v] of entries) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenKeys(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

/**
 * @param {string} filePath
 * @returns {Promise<{ path: string, locale: string, data: object, flat: Record<string, unknown> }>}
 */
export async function loadLocaleFile(filePath) {
  const abs = path.resolve(String(filePath));
  const raw = await fs.readFile(abs, "utf8");
  const ext = path.extname(abs).toLowerCase();
  let data;
  if (ext === ".yaml" || ext === ".yml") {
    data = YAML.parse(raw);
  } else {
    data = JSON.parse(raw);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Locale file must be a JSON/YAML object: ${abs}`);
  }
  const base = path.basename(abs, path.extname(abs));
  return { path: abs, locale: base, data, flat: flattenKeys(data) };
}

/**
 * Compare multiple locale files for missing/extra keys.
 * @param {{ files: string[], baseLocale?: string }} input
 */
export async function compareLocales(input) {
  const files = input.files;
  if (!Array.isArray(files) || files.length < 2) {
    throw new Error("Provide at least 2 locale files to compare");
  }
  const loaded = [];
  for (const f of files) {
    loaded.push(await loadLocaleFile(f));
  }
  const baseName = input.baseLocale;
  let base = loaded[0];
  if (baseName) {
    const found = loaded.find(
      (l) => l.locale === baseName || path.basename(l.path) === baseName || l.path.endsWith(baseName),
    );
    if (!found) throw new Error(`baseLocale not found: ${baseName}`);
    base = found;
  }
  const baseKeys = new Set(Object.keys(base.flat));
  const comparisons = loaded
    .filter((l) => l.path !== base.path)
    .map((l) => {
      const keys = new Set(Object.keys(l.flat));
      const missing = [...baseKeys].filter((k) => !keys.has(k)).sort();
      const extra = [...keys].filter((k) => !baseKeys.has(k)).sort();
      return {
        locale: l.locale,
        file: l.path,
        keyCount: keys.size,
        missingCount: missing.length,
        extraCount: extra.length,
        missing,
        extra,
      };
    });
  return {
    base: { locale: base.locale, file: base.path, keyCount: baseKeys.size },
    comparisons,
    allLocales: loaded.map((l) => ({ locale: l.locale, file: l.path, keyCount: Object.keys(l.flat).length })),
  };
}

/**
 * Find empty translations (null, "", whitespace-only).
 * @param {{ files: string[] }} input
 */
export async function findEmptyTranslations(input) {
  const files = input.files;
  if (!Array.isArray(files) || files.length < 1) {
    throw new Error("Provide at least 1 locale file");
  }
  const results = [];
  for (const f of files) {
    const loaded = await loadLocaleFile(f);
    const empty = [];
    for (const [key, val] of Object.entries(loaded.flat)) {
      if (val === null || val === undefined) {
        empty.push({ key, reason: "null/undefined" });
      } else if (typeof val === "string" && val.trim() === "") {
        empty.push({ key, reason: "empty string" });
      } else if (Array.isArray(val) && val.length === 0) {
        empty.push({ key, reason: "empty array" });
      }
    }
    results.push({
      locale: loaded.locale,
      file: loaded.path,
      emptyCount: empty.length,
      empty: empty.sort((a, b) => a.key.localeCompare(b.key)),
    });
  }
  return { files: results };
}

/**
 * List all keys (flat) for a locale file.
 * @param {{ filePath: string }} input
 */
export async function listKeys(input) {
  const loaded = await loadLocaleFile(input.filePath);
  const keys = Object.keys(loaded.flat).sort();
  return {
    locale: loaded.locale,
    file: loaded.path,
    keyCount: keys.length,
    keys,
  };
}
