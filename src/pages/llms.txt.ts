import { PRODUCT_TOTAL, SITE } from "../config/site";
import { llmsTxt } from "../lib/discovery.js";

export function GET() {
  return new Response(llmsTxt(SITE, PRODUCT_TOTAL), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
