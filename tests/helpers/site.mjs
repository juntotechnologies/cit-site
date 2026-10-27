/** Loads the real data files into the typed site object, so tests run against the files the build reads. */
import { readFileSync } from "node:fs";
import { loadSite } from "../../src/lib/site.js";

function readJson(name) {
  return JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), "utf8"));
}

export const products = readJson("products");
export const site = loadSite({ metadata: readJson("metadata"), pages: readJson("pages"), discovery: readJson("discovery") });
export const total = products.length;
