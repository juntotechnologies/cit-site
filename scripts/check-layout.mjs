/** Check (browser): at each width and page in layout-rules.json, no sideways scroll, no long heading, equal outer margins, tall enough controls and structure images that fill their box. Run `npm run build` first. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { describeHeading, describeMargins, describeOverflow, describeStructure, describeTarget, overflowBy, smallStructures, tooManyLines, tooSmallTargets, unevenMargins } from "../src/lib/layout-budget.js";
import { serveDist } from "./serve-dist.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rules = JSON.parse(readFileSync(join(root, "scripts", "layout-rules.json"), "utf8"));

/** Runs in the page. It reads one heading: its words, its height and its line height. */
function headingRow(node) {
  const style = getComputedStyle(node);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
  return { text: node.textContent.trim().slice(0, 40), height: node.getBoundingClientRect().height, lineHeight };
}

/** Runs in the page. It reads where one block starts and ends. */
function frameRow(node) {
  const box = node.getBoundingClientRect();
  return { left: box.left, right: box.right };
}

/** Runs in the page. It reads one control: its words and its height. */
function targetRow(node) {
  return { text: (node.textContent || node.getAttribute("aria-label") || node.name || "").trim().slice(0, 30), height: node.getBoundingClientRect().height };
}

/** Runs in the page. It reads one structure image: its alt text, its width and the width of its box. */
function structureRow(node) {
  return { text: node.alt.slice(0, 40), width: node.getBoundingClientRect().width, frameWidth: node.parentElement.getBoundingClientRect().width };
}

/** Runs in the page. It reads the width of the page and of the screen. */
function pageWidths() {
  return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth };
}

function readNode(read, node) {
  return node.evaluate(read);
}

async function rowsOf(page, selector, read) {
  return Promise.all((await page.locator(selector).all()).map(readNode.bind(null, read)));
}

function withSelector(selector, row) {
  return { ...row, selector };
}

async function framesOf(page, selector) {
  return (await rowsOf(page, selector, frameRow)).map(withSelector.bind(null, selector));
}

async function measure(page) {
  const frames = await Promise.all(rules.frames.map(framesOf.bind(null, page)));
  const widths = await page.evaluate(pageWidths);
  return { widths, frames: frames.flat(), headings: await rowsOf(page, rules.headings, headingRow), targets: await rowsOf(page, rules.tapTargets.selector, targetRow), structures: await rowsOf(page, rules.structureImages.selector, structureRow) };
}

function faultsOf(where, width, found) {
  const pixels = overflowBy(found.widths);
  const sideways = pixels ? [describeOverflow(where, pixels)] : [];
  const headings = tooManyLines(found.headings, rules.maxHeadingLines).map(describeHeading.bind(null, where, rules.maxHeadingLines));
  const margins = unevenMargins(found.frames, found.widths.client, rules.marginTolerance).map(describeMargins.bind(null, where, found.widths.client));
  const phone = width <= rules.tapTargets.maxWidth;
  const targets = phone ? tooSmallTargets(found.targets, rules.tapTargets.minHeight).map(describeTarget.bind(null, where, rules.tapTargets.minHeight)) : [];
  const structures = smallStructures(found.structures, rules.structureImages.minWidthRatio).map(describeStructure.bind(null, where, rules.structureImages.minWidthRatio));
  return [...sideways, ...headings, ...margins, ...targets, ...structures];
}

async function faultsAt(context, origin, width, path) {
  const page = await context.newPage();
  await page.goto(origin + path, { waitUntil: "networkidle" });
  const faults = faultsOf(`${width} px ${path}`, width, await measure(page));
  await page.close();
  return faults;
}

async function faultsAtWidth(browser, origin, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  const found = [];
  for (const path of rules.pages) found.push(await faultsAt(context, origin, width, path));
  await context.close();
  return found.flat();
}

async function main() {
  const { server, port } = await serveDist(join(root, "dist"));
  const browser = await chromium.launch();
  const found = [];
  for (const width of rules.widths) found.push(await faultsAtWidth(browser, `http://127.0.0.1:${port}`, width));
  await browser.close();
  server.close();
  const faults = found.flat();
  console.log(faults.length ? faults.join("\n") : `layout ok: ${rules.pages.length} pages at ${rules.widths.join(", ")} px`);
  process.exit(faults.length ? 1 : 0);
}

await main();
