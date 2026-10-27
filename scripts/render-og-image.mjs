/** Renders public/assets/og-image.jpg, the 1200 by 630 social image, from the facility photo and the logo. Run: npm run og. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { brandColor } from "../src/lib/palette.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SIZE = { width: 1200, height: 630 };
const BAND = 170;

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

function dataUri(path) {
  return `data:image/png;base64,${readFileSync(join(root, path)).toString("base64")}`;
}

/** The page the browser draws: the photo above, the logo on a brand color band below. */
export function ogHtml({ photo, logo, color }) {
  const style = `*{margin:0}body{width:${SIZE.width}px;height:${SIZE.height}px;background:${color};overflow:hidden}`;
  const photoStyle = `display:block;width:100%;height:${SIZE.height - BAND}px;object-fit:cover;object-position:center 35%`;
  const logoStyle = `display:block;height:${BAND - 50}px;margin:25px 0 0 60px`;
  return `<style>${style}</style><img src="${photo}" style="${photoStyle}"><img src="${logo}" style="${logoStyle}">`;
}

async function render(html) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: SIZE });
  await page.setContent(html);
  const jpeg = await page.screenshot({ type: "jpeg", quality: 86 });
  await browser.close();
  return jpeg;
}

async function main() {
  const color = brandColor(readText("src/styles/palette.css"));
  const html = ogHtml({ photo: dataUri("public/assets/banner1.png"), logo: dataUri("public/assets/logo.png"), color });
  writeFileSync(join(root, "public/assets/og-image.jpg"), await render(html));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
