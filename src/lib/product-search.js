/** The catalogue search, category filter and pagination of the products page. */
import { onPageLoad } from "./page-lifecycle.js";
import { productCardHtml } from "./product-card.js";

const PAGE_SIZE = 50;
const WINDOW = 5;
const DEBOUNCE_MS = 220;
const GAP = "<span>…</span>";
const SEARCH_FIELDS = ["name", "cas", "molecular_formula", "catalog_number"];
const IDS = { search: "product-search", grid: "product-grid", count: "search-count", pagination: "pagination", category: "cat-filter" };

function categoriesOf(product) {
  return [product.category || "", ...(product.tags || [])];
}

function matchesCategory(product, cat) {
  return !cat || categoriesOf(product).includes(cat);
}

function fieldContains(product, query, field) {
  return (product[field] || "").toLowerCase().includes(query);
}

function matchesQuery(product, query) {
  return !query || SEARCH_FIELDS.some(fieldContains.bind(null, product, query));
}

function matches(query, cat, product) {
  return matchesCategory(product, cat) && matchesQuery(product, query);
}

export function filterProducts(products, { q = "", cat = "" } = {}) {
  return products.filter(matches.bind(null, q.toLowerCase().trim(), cat));
}

function pageLink(page, text = page) {
  return `<a href="#" data-page="${page}">${text}</a>`;
}

function pageWindow(current, totalPages) {
  const lo = Math.max(1, current - Math.floor(WINDOW / 2));
  const hi = Math.min(totalPages, lo + WINDOW - 1);
  return { lo: Math.max(1, Math.min(lo, hi - WINDOW + 1)), hi };
}

function pageNumber(lo, _, index) {
  return lo + index;
}

function numberHtml(current, page) {
  return page === current ? `<span class="current">${page}</span>` : pageLink(page);
}

function gapIf(hidesPages) {
  return hidesPages ? GAP : "";
}

function leadingHtml(lo) {
  return lo > 1 ? pageLink(1) + gapIf(lo > 2) : "";
}

function trailingHtml(hi, totalPages) {
  return hi < totalPages ? gapIf(hi < totalPages - 1) + pageLink(totalPages) : "";
}

export function buildPaginationHtml(current, totalPages) {
  if (totalPages <= 1) return "";
  const { lo, hi } = pageWindow(current, totalPages);
  const numbers = Array.from({ length: hi - lo + 1 }, pageNumber.bind(null, lo)).map(numberHtml.bind(null, current));
  const previous = current > 1 ? pageLink(current - 1, "‹") : "";
  const next = current < totalPages ? pageLink(current + 1, "›") : "";
  return [previous, leadingHtml(lo), ...numbers, trailingHtml(hi, totalPages), next].join("");
}

function setOrDelete(params, key, value) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function syncUrl(q, cat) {
  const next = new URLSearchParams(location.search);
  setOrDelete(next, "q", q);
  setOrDelete(next, "cat", cat);
  const query = next.toString();
  history.replaceState(null, "", query ? `?${query}` : location.pathname);
}

function summary(start, total) {
  const last = Math.min(start + PAGE_SIZE, total);
  return `Showing ${Math.min(start + 1, total)}–${last} of ${total.toLocaleString()} products`;
}

function cardHtml(label, product) {
  return productCardHtml({ product, path: product.product_path, label, showCategory: true });
}

/** Draws the current page of results. `view` is { products, label, els, current, filtered, timer }. */
function render(view) {
  const start = (view.current - 1) * PAGE_SIZE;
  const slice = view.filtered.slice(start, start + PAGE_SIZE);
  view.els.grid.innerHTML = slice.map(cardHtml.bind(null, view.label)).join("");
  view.els.count.textContent = summary(start, view.filtered.length);
  view.els.pagination.innerHTML = buildPaginationHtml(view.current, Math.ceil(view.filtered.length / PAGE_SIZE));
}

function applyFilters(view) {
  const q = view.els.search.value;
  const cat = view.els.category.value;
  view.filtered = filterProducts(view.products, { q, cat });
  syncUrl(q.trim(), cat);
  view.current = 1;
  render(view);
}

function goToPage(view, event) {
  const link = event.target.closest("a[data-page]");
  if (!link) return;
  event.preventDefault();
  view.current = Number(link.dataset.page);
  window.scrollTo(0, 0);
  render(view);
}

function scheduleFilters(view) {
  clearTimeout(view.timer);
  view.timer = setTimeout(applyFilters.bind(null, view), DEBOUNCE_MS);
}

function clearTimer(view) {
  clearTimeout(view.timer);
}

function restoreFromUrl(els) {
  const params = new URLSearchParams(location.search);
  if (params.get("q")) els.search.value = params.get("q");
  if (params.get("cat")) els.category.value = params.get("cat");
}

function bindEvents(view) {
  view.els.pagination.addEventListener("click", goToPage.bind(null, view));
  view.els.search.addEventListener("input", scheduleFilters.bind(null, view));
  view.els.category.addEventListener("change", applyFilters.bind(null, view));
  document.addEventListener("astro:before-swap", clearTimer.bind(null, view), { once: true });
}

function elementEntry([key, id]) {
  return [key, document.getElementById(id)];
}

/** Guards against double-binding when astro:page-load fires twice for the same DOM, with no swap in between. */
function claim(search) {
  if (search.dataset.searchBound === "true") return false;
  search.dataset.searchBound = "true";
  return true;
}

function bind(products, label) {
  const els = Object.fromEntries(Object.entries(IDS).map(elementEntry));
  if (!Object.values(els).every(Boolean) || !claim(els.search)) return;
  const view = { products, label, els, current: 1, filtered: products, timer: undefined };
  restoreFromUrl(els);
  bindEvents(view);
  applyFilters(view);
}

/** Wires the /products search, filter and pagination on every astro:page-load: the first load and each client-side swap. */
export function initProductSearch(products, label) {
  onPageLoad(bind.bind(null, products, label));
}
