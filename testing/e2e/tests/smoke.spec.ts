import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* armazenamento indisponível */ } });
  await page.getByRole('textbox', { name: 'E-mail' }).fill('e2e@biweb.test');
  await page.getByRole('textbox', { name: 'Senha' }).fill('biweb-e2e');
  await page.locator('.lp-submit').click();
  await expect(page.getByRole('navigation', { name: 'Áreas' })).toBeVisible({ timeout: 10_000 });
}

test('login de demonstração abre o workspace', async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.app-content')).toBeVisible();
});

test('áreas críticas permanecem navegáveis após autenticação', async ({ page }) => {
  await signIn(page);

  for (const [name, path] of [['Relatórios', '/reports'], ['Dados', '/connections'], ['Mapas', '/maps'], ['Fluxos', '/workflows']] as const) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('.app-content')).toBeVisible();
  }
});
