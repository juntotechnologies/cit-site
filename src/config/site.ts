import metadata from "../../data/metadata.json";
import pages from "../../data/pages.json";
import discovery from "../../data/discovery.json";
import rawProducts from "../../data/products.json";
import { loadSite } from "../lib/site.js";

/** The one site object. Every page, the layout and the discovery files read their facts from it. */
export const SITE = loadSite({ metadata, pages, discovery });
export const COMPANY = SITE.company;
export const TEAM = SITE.team;
export const PRODUCT_TOTAL = rawProducts.length;
