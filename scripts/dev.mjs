/** Dev entry: starts the Astro dev server on all interfaces and prints only the one tailnet link. */
import { spawn } from "node:child_process";
import dev from "./dev.json" with { type: "json" };
import { tailnetHost } from "./tailnet.mjs";

const READY = new RegExp(dev.readyPattern, "i");

/** Collects the server output. It prints the link once, when the server reports that it is ready. */
function onOutput(state, chunk) {
  state.log += chunk;
  if (state.announced || !READY.test(state.log)) return;
  state.announced = true;
  console.log(`http://${state.host.name}:${dev.port}/`);
}

function onExit(state, code) {
  if (code && !state.announced) console.error(state.log);
  process.exit(code ?? 0);
}

function startServer(host) {
  const hosts = [host.name, host.ip].join(",");
  const args = ["astro", "dev", "--host", "0.0.0.0", "--port", String(dev.port)];
  return spawn("npx", args, { env: { ...process.env, [dev.hostsEnv]: hosts }, stdio: ["inherit", "pipe", "pipe"] });
}

function main() {
  const state = { host: tailnetHost(), log: "", announced: false };
  const server = startServer(state.host);
  server.stdout.setEncoding("utf8").on("data", onOutput.bind(null, state));
  server.stderr.setEncoding("utf8").on("data", onOutput.bind(null, state));
  server.on("exit", onExit.bind(null, state));
}

main();
