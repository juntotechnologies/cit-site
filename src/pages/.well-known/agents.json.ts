import { PRODUCT_TOTAL, SITE } from "../../config/site";
import { agentsJson } from "../../lib/discovery.js";

export function GET() {
  return new Response(JSON.stringify(agentsJson(SITE, PRODUCT_TOTAL), null, 2), { headers: { "Content-Type": "application/json" } });
}
