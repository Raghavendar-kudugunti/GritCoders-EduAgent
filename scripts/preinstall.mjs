import { rm } from "node:fs/promises";

const userAgent = process.env.npm_config_user_agent ?? "";
if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm to install this workspace.");
  process.exit(1);
}

await Promise.all([
  rm("package-lock.json", { force: true }),
  rm("yarn.lock", { force: true }),
]);
