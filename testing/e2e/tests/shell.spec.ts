import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Início mostra pulso, recentes e Copilot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pulso do negócio' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Continue de onde parou' })).toBeVisible();
});

test('Relatórios: grade, filtro por categoria e lista', async ({ page }) => {
  await page.goto('/reports');
  await expect(page.locator('.rp-grid .rp-card').first()).toBeVisible();
  await expect(page.locator('.rp-grid .rp-card')).toHaveCount(12);
  await page.getByRole('tab', { name: /Operações/ }).click();
  await expect(page.locator('.rp-grid .rp-card')).toHaveCount(2);
  await page.getByRole('radio', { name: 'Lista' }).click().catch(() => page.getByRole('button', { name: 'Lista' }).click());
  await expect(page.locator('.rp-list .rp-row:not(.rp-row--head)')).toHaveCount(2);
});

test('Abrir relatório e perguntar ao Copilot', async ({ page }) => {
  await page.goto('/reports/rpt_visao_executiva');
  await expect(page.getByRole('heading', { name: 'Visão Executiva de Vendas' })).toBeVisible();
  await page.getByRole('button', { name: 'Resumir com Copilot' }).click();
  await expect(page.getByRole('region', { name: 'Copilot' })).toBeVisible();
  await expect(page.getByText('Destaques do período', { exact: false })).toBeVisible({ timeout: 8000 });
});

test('Builder abre com painéis e Inspector', async ({ page }) => {
  await page.goto('/reports/rpt_visao_executiva/edit');
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible();
  await expect(page.getByRole('treegrid', { name: /Campos do modelo/ })).toBeVisible();
});

test('IA desligada remove o Copilot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Exibição e preferências' }).click();
  await page.getByRole('switch', { name: /Copilot/ }).click({ force: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Copilot' })).toHaveCount(0);
});

for (const path of ['/', '/reports', '/reports/rpt_visao_executiva']) {
  test(`axe sem violações graves em ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(1500); // espera as animações de entrada terminarem
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
  });
}
