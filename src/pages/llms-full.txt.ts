import rawProducts from "../../data/products.json";
import { SITE } from "../config/site";
import { llmsFullTxt } from "../lib/discovery.js";
import { productEntries } from "../lib/catalogue.js";

export function GET() {
  return new Response(llmsFullTxt(SITE, productEntries(rawProducts)), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
