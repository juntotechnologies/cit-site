/** Reads this machine's tailnet name and address from Tailscale, so no host name is written in code. */
import { execFileSync } from "node:child_process";

export function parseSelf(raw) {
  const self = JSON.parse(raw).Self;
  return { name: String(self.DNSName).replace(/\.$/, ""), ip: String(self.TailscaleIPs[0]) };
}

export function tailnetHost() {
  return parseSelf(execFileSync("tailscale", ["status", "--self", "--json"], { encoding: "utf8" }));
}

/** The host names the dev server must accept, from a comma-separated environment value. Empty when unset. */
export function allowedHosts(value) {
  return (value ?? "").split(",").filter(Boolean);
}
