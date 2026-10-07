import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Home lista os dashboards do workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboards' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Visão Executiva de Vendas' })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(6);
});

test('Builder abre com painéis e Inspector', async ({ page }) => {
  await page.goto('/dashboards/dsh_visao_executiva/edit');
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible();
  await expect(page.getByRole('treegrid', { name: /Campos do modelo/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assistente' })).toBeVisible();
});

test('Tema do app e IA desligada', async ({ page }) => {
  await page.goto('/dashboards/dsh_visao_executiva/edit');
  await page.getByRole('button', { name: 'Exibição e preferências' }).click();
  await page.getByRole('radio', { name: 'Escuro' }).first().click().catch(async () => page.getByRole('button', { name: 'Escuro' }).first().click());
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('switch', { name: 'Assistente de IA' }).click({ force: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Assistente' })).toHaveCount(0);
});

test('Home sem violações graves de acessibilidade (axe)', async ({ page }) => {
  await page.goto('/');
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => v.id)).toEqual([]);
});
