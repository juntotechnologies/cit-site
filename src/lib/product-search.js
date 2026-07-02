import { onPageLoad } from "./page-lifecycle.js";

export function formulaToHtml(f) {
  return (f || "").replace(/([A-Za-z\)\]])(\d+)/g, "$1<sub>$2</sub>");
}

export function filterProducts(products, { q = "", cat = "" } = {}) {
  const query = q.toLowerCase().trim();
  return products.filter((p) => {
    const matchCat = !cat || (p.category || "") === cat || (p.tags || []).includes(cat);
    const matchQ =
      !query ||
      (p.name || "").toLowerCase().includes(query) ||
      (p.cas || "").toLowerCase().includes(query) ||
      (p.molecular_formula || "").toLowerCase().includes(query) ||
      (p.catalog_number || "").toLowerCase().includes(query);
    return matchCat && matchQ;
  });
}

export function buildPaginationHtml(current, totalPages) {
  if (totalPages <= 1) return "";
  let html = "";
  if (current > 1) html += `<a href="#" data-page="${current - 1}">‹</a>`;
  const W = 5;
  let lo = Math.max(1, current - Math.floor(W / 2));
  const hi = Math.min(totalPages, lo + W - 1);
  if (hi - lo < W - 1) lo = Math.max(1, hi - W + 1);
  if (lo > 1) html += `<a href="#" data-page="1">1</a>${lo > 2 ? "<span>…</span>" : ""}`;
  for (let i = lo; i <= hi; i++)
    html += i === current ? `<span class="current">${i}</span>` : `<a href="#" data-page="${i}">${i}</a>`;
  if (hi < totalPages) html += `${hi < totalPages - 1 ? "<span>…</span>" : ""}<a href="#" data-page="${totalPages}">${totalPages}</a>`;
  if (current < totalPages) html += `<a href="#" data-page="${current + 1}">›</a>`;
  return html;
}

const PAGE_SIZE = 50;

// Wires up the /products search/filter/pagination UI. Called on every
// astro:page-load fire (initial load + every client-side navigation swap).
export function initProductSearch(products, CIT_LABEL) {
  onPageLoad(() => {
    const searchEl = document.getElementById("product-search");
    const grid = document.getElementById("product-grid");
    if (!searchEl || !grid) return;

    // Guards against double-binding if astro:page-load ever fires twice for
    // the same DOM instance (e.g. no swap occurred) rather than relying
    // solely on view-transitions always producing fresh nodes.
    if (searchEl.dataset.searchBound === "true") return;
    searchEl.dataset.searchBound = "true";

    const countEl = document.getElementById("search-count");
    const pagEl = document.getElementById("pagination");
    const catEl = document.getElementById("cat-filter");

    let current = 1;
    let filtered = products;
    let timer;

    const params = new URLSearchParams(location.search);
    const initQ = params.get("q") || "";
    const initCat = params.get("cat") || "";
    if (initQ) searchEl.value = initQ;
    if (initCat) catEl.value = initCat;

    function syncUrl(q, cat) {
      const next = new URLSearchParams(location.search);
      q ? next.set("q", q) : next.delete("q");
      cat ? next.set("cat", cat) : next.delete("cat");
      const qs = next.toString();
      history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
    }

    function applyFilters() {
      const q = searchEl.value;
      const cat = catEl.value;
      filtered = filterProducts(products, { q, cat });
      syncUrl(q.trim(), cat);
      current = 1;
      render();
    }

    function render() {
      const start = (current - 1) * PAGE_SIZE;
      const slice = filtered.slice(start, start + PAGE_SIZE);

      grid.innerHTML = slice
        .map((p) => {
          const img = p.image_file
            ? `<img src="/images/${p.image_file}" alt="${p.name || ""}" loading="lazy" />`
            : `<span class="no-img">⚗️</span>`;
          const badge = p.category ? `<span class="product-cat-badge">${p.category.replace("-", " ")}</span>` : "";
          const formula = p.molecular_formula ? `<p class="product-formula">${formulaToHtml(p.molecular_formula)}</p>` : "";
          return `
        <div class="product-card">
          <div class="product-image">${img}</div>
          ${badge}
          <h3><a href="${p.product_path}">${p.name || "Unknown"}</a></h3>
          ${p.catalog_number ? `<p class="product-meta">${CIT_LABEL} ${p.catalog_number}</p>` : ""}
          ${p.cas ? `<p class="product-meta">CAS ${p.cas}</p>` : ""}
          ${formula}
        </div>`;
        })
        .join("");

      countEl.textContent = `Showing ${Math.min(start + 1, filtered.length)}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length.toLocaleString()} products`;

      const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
      pagEl.innerHTML = buildPaginationHtml(current, totalPages);
    }

    pagEl.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-page]");
      if (!a) return;
      e.preventDefault();
      current = Number(a.dataset.page);
      window.scrollTo(0, 0);
      render();
    });

    searchEl.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 220);
    });
    catEl.addEventListener("change", applyFilters);

    document.addEventListener("astro:before-swap", () => clearTimeout(timer), { once: true });

    applyFilters();
  });
}
