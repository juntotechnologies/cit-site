import { PRODUCT_TOTAL, SITE } from "../config/site";
import { agentsTxt } from "../lib/discovery.js";

export function GET() {
  return new Response(agentsTxt(SITE, PRODUCT_TOTAL), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
