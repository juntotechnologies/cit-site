/** A small static server for the built site in dist/. It answers a missing path with 404.html, as Netlify does. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".txt": "text/plain", ".xml": "application/xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon" };

/** The file a request path names: a folder path serves its index.html. */
export function filePathOf(root, urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  return join(root, extname(clean) ? clean : join(clean, "index.html"));
}

async function readOr(path, fallback) {
  try {
    return { body: await readFile(path), status: 200, path };
  } catch {
    return fallback;
  }
}

async function answer(root, request, response) {
  const path = filePathOf(root, request.url);
  const missing = { body: await readFile(join(root, "404.html")), status: 404, path: "404.html" };
  const found = await readOr(path, missing);
  response.writeHead(found.status, { "Content-Type": TYPES[extname(found.path)] ?? "application/octet-stream" });
  response.end(found.body);
}

function listening(server, resolve) {
  resolve({ server, port: server.address().port });
}

function listen(server, resolve) {
  server.listen(0, "127.0.0.1", listening.bind(null, server, resolve));
}

/** Starts the server on a free port and resolves with { server, port }. */
export function serveDist(root) {
  const server = createServer(answer.bind(null, root));
  return new Promise(listen.bind(null, server));
}
