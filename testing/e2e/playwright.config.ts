import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // A UI escolhe o idioma pelo navegador quando não há preferência salva (apps/web/src/i18n). Os testes são em pt-BR.
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'pt-BR',
    viewport: { width: 1440, height: 900 },
    // Mantém a execução local leve e preserva evidências suficientes no CI.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}) } }],
  webServer: { command: 'pnpm --filter @biweb/web dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI, cwd: '../..', timeout: 120_000 },
});
