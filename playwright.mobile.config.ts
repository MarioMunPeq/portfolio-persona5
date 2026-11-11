import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-360x740",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
    },
    {
      name: "mobile-390x844",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "mobile-430x932",
      use: { ...devices["Pixel 7"], viewport: { width: 430, height: 932 } },
    },
  ],
});
