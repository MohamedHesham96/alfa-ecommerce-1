import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, NEXT_PUBLIC_ENABLE_PWA: "true" };

function run(command) {
  const result = spawnSync(command, {
    cwd: root,
    stdio: "inherit",
    env,
    shell: true,
    windowsHide: true,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// The PWA suite must exercise the enabled state even though the product
// default is disabled (NEXT_PUBLIC_ENABLE_PWA=false or unset).
run("npm run build");
run("npx playwright test -c playwright.pwa.config.js");
