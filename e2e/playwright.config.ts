import { defineConfig, devices } from '@playwright/test';

const CHROME_PATH = process.env.CHROME_EXECUTABLE_PATH || '/home/laziz/.nix-profile/bin/google-chrome-stable';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: CHROME_PATH,
    },
  },
  projects: [
    {
      name: 'web-user',
      testDir: './tests/user',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'web-partner',
      testDir: './tests/partner',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
    },
    {
      name: 'web-admin',
      testDir: './tests/admin',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
    },
  ],
});
