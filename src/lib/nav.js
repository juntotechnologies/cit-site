/** Navigation helpers: which menu entry is current, and the lists the header and footer show. */

/** True when `current` is the page `path` or below it. Home matches only itself. */
export function isActive(current, path) {
  return path === "/" ? current === "/" : current.startsWith(path);
}

function hasMenu(page) {
  return Boolean(page.menu);
}

function menuItem(page) {
  return { label: page.menu, path: page.path };
}

function hasFooter(page) {
  return Boolean(page.footer);
}

function footerItem(page) {
  return { label: page.footer, path: page.path };
}

/** The pages the header menu shows, in stored order, as { label, path }. */
export function menuItems(site) {
  return site.pages.filter(hasMenu).map(menuItem);
}

function serviceLink(service) {
  return { label: service.title, path: `/services/${service.slug}/` };
}

function menuEntry(services, current, item) {
  const children = item.path === "/services/" ? services.map(serviceLink) : [];
  return { ...item, active: isActive(current, item.path), children };
}

/** The header menu as the template draws it: { label, path, active, children }. The Services entry holds the service pages. */
export function menuView(site, services, current) {
  return menuItems(site).map(menuEntry.bind(null, services, current));
}

/** The pages the footer quick links show, in stored order, as { label, path }. */
export function footerItems(site) {
  return site.pages.filter(hasFooter).map(footerItem);
}
