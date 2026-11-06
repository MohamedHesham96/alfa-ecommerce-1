const path = require("node:path");
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "**/pwa.spec.js",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    serviceWorkers: "allow",
  },
  webServer: [
    {
      command: "node e2e/pwa-api-server.mjs",
      cwd: path.resolve(__dirname),
      url: "http://localhost:8787/health",
      timeout: 30_000,
      reuseExistingServer: false,
    },
    {
      command: "npm run start:e2e",
      cwd: path.resolve(__dirname),
      url: "http://localhost:3100/offline",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:8787",
      },
    },
  ],
});
