// /Users/entheos/Documents/Ghost-Factory/scripts/validateTraitManifest.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TRAIT_MANIFEST, UI_ORDER } from "../src/data/traits.js";
import { LAYER_ORDER } from "../src/lib/traitUtils.js";
import { createGhostFactoryTemplateConfig } from "../src/lib/templateConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");

const errors = [];
const warnings = [];

function normalizeKey(key) {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

assert(Array.isArray(UI_ORDER), "UI_ORDER must be an array.");
assert(Array.isArray(LAYER_ORDER), "LAYER_ORDER must be an array.");

for (const layerKey of UI_ORDER) {
  assert(Boolean(TRAIT_MANIFEST[layerKey]), `UI_ORDER references missing layer "${layerKey}".`);
}

for (const layerKey of LAYER_ORDER) {
  assert(Boolean(TRAIT_MANIFEST[layerKey]), `LAYER_ORDER references missing layer "${layerKey}".`);
}

for (const [layerKey, layer] of Object.entries(TRAIT_MANIFEST)) {
  assert(layer && typeof layer === "object", `Layer "${layerKey}" must be an object.`);
  assert(typeof layer.label === "string" && layer.label.trim(), `Layer "${layerKey}" needs a label.`);
  assert(layer.options && typeof layer.options === "object", `Layer "${layerKey}" needs options.`);

  const normalizedKeys = new Map();

  for (const [traitKey, assetPath] of Object.entries(layer.options || {})) {
    assert(typeof traitKey === "string" && traitKey.trim(), `Layer "${layerKey}" has an empty trait key.`);

    const normalized = normalizeKey(traitKey);
    const previous = normalizedKeys.get(normalized);
    assert(
      !previous,
      `Layer "${layerKey}" has duplicate normalized trait keys "${previous}" and "${traitKey}".`,
    );
    normalizedKeys.set(normalized, traitKey);

    if (assetPath === null && traitKey === "none") {
      continue;
    }

    assert(
      typeof assetPath === "string" && assetPath.trim(),
      `Trait "${layerKey}.${traitKey}" needs an asset path or a null "none" value.`,
    );

    if (typeof assetPath !== "string") {
      continue;
    }

    const absoluteAssetPath = path.join(publicRoot, assetPath);
    assert(
      fs.existsSync(absoluteAssetPath),
      `Trait "${layerKey}.${traitKey}" references missing asset public/${assetPath}.`,
    );
  }

  warn(
    Object.keys(layer.options || {}).length > 0,
    `Layer "${layerKey}" does not contain any trait options.`,
  );
}

const templateConfig = createGhostFactoryTemplateConfig({
  traitManifest: TRAIT_MANIFEST,
  layerOrder: UI_ORDER,
});

assert(
  templateConfig.layers.length === UI_ORDER.length,
  "Exported template config should include every UI layer.",
);

const traitCount = Object.values(TRAIT_MANIFEST).reduce(
  (total, layer) => total + Object.keys(layer.options || {}).length,
  0,
);

console.log("Ghost Factory trait manifest validation");
console.log(`Checked ${Object.keys(TRAIT_MANIFEST).length} layers.`);
console.log(`Checked ${traitCount} trait options.`);
console.log(`Checked ${templateConfig.layers.length} exported template layers.`);

if (warnings.length) {
  console.log("");
  console.log(`Warnings (${warnings.length}):`);
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (errors.length) {
  console.log("");
  console.log(`Errors (${errors.length}):`);
  for (const error of errors) {
    console.log(`- ${error}`);
  }
  process.exit(1);
}

console.log("OK: trait manifest, assets, and template config are valid.");
