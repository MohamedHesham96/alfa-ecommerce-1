const path = require("node:path");
const { defineConfig } = require("@playwright/test");

const frontendRoot = __dirname;
const backendRoot = path.resolve(__dirname, "../alfa-ecommerce");

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  testIgnore: "**/pwa.spec.js",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "node e2e/smtp-server.mjs",
      cwd: frontendRoot,
      url: "http://localhost:3026/health",
      timeout: 30_000,
      reuseExistingServer: false,
    },
    {
      command: "mvnw.cmd -q spring-boot:run -Dspring-boot.run.profiles=e2e",
      cwd: backendRoot,
      url: "http://localhost:8787/api/auth/is-admin",
      timeout: 240_000,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev",
      cwd: frontendRoot,
      url: "http://localhost:3000/forgotpassword",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:8787",
      },
    },
  ],
});
