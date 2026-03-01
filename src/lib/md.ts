/** Minimal markdown → HTML converter for scraped static pages */
export function md(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/gs, "<ul>$&</ul>")
    .replace(/^(?!<[hul\n]|$)(.+)$/gm, "<p>$1</p>")
    .replace(/\n{3,}/g, "\n\n");
}

export function loadPage(mdPath: string): string {
  try {
    // Dynamic import via fs — only works at build time in Astro
    const fs = require("node:fs") as typeof import("node:fs");
    return fs.readFileSync(mdPath, "utf-8");
  } catch {
    return "";
  }
}
