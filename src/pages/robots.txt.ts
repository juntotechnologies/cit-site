import { SITE } from "../config/site";
import { robotsTxt } from "../lib/discovery.js";

export function GET() {
  return new Response(robotsTxt(SITE), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
