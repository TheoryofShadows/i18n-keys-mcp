import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { flattenKeys, compareLocales, findEmptyTranslations, listKeys } from "../lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const en = path.join(__dirname, "../fixtures/en.json");
const es = path.join(__dirname, "../fixtures/es.json");
const fr = path.join(__dirname, "../fixtures/fr.yaml");

describe("flattenKeys", () => {
  it("flattens nested objects", () => {
    const flat = flattenKeys({ a: { b: 1 }, c: "x" });
    assert.deepEqual(flat, { "a.b": 1, c: "x" });
  });
});

describe("compareLocales", () => {
  it("finds missing and extra vs en", async () => {
    const r = await compareLocales({ files: [en, es], baseLocale: "en" });
    const esCmp = r.comparisons.find((c) => c.locale === "es");
    assert.ok(esCmp.missing.includes("app.subtitle"));
    assert.ok(esCmp.extra.includes("extra"));
  });

  it("supports yaml", async () => {
    const r = await compareLocales({ files: [en, fr] });
    assert.equal(r.comparisons.length, 1);
  });
});

describe("findEmptyTranslations", () => {
  it("flags empty strings", async () => {
    const r = await findEmptyTranslations({ files: [en, fr] });
    const enRes = r.files.find((f) => f.locale === "en");
    assert.ok(enRes.empty.some((e) => e.key === "empty"));
  });
});

describe("listKeys", () => {
  it("lists flat keys", async () => {
    const r = await listKeys({ filePath: en });
    assert.ok(r.keys.includes("app.title"));
    assert.ok(r.keyCount >= 4);
  });
});
