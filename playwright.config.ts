import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load e2e-specific environment variables
const envPath = path.resolve(__dirname, '.env.e2e');
dotenv.config({ path: envPath });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `node -r dotenv/config node_modules/.bin/astro dev --host`,
    env: {
      DOTENV_CONFIG_PATH: envPath,
      ...process.env,
    },
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
