import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)
export default defineConfig({
  testDir: './tests', fullyParallel: false, timeout: 30000,
  use: { baseURL, launchOptions: { executablePath, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }, trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'npm run dev -- --port 5173', url: baseURL, reuseExistingServer: true, timeout: 30000 },
})
