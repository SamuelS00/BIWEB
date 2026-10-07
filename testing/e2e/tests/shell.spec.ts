import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ok */ } }); });

const askAi = async (page: Page, text: string) => {
  await page.locator('.ai-input textarea').fill(text);
  await page.keyboard.press('Enter');
  await expect(page.locator('.ai-msg').last().locator('.ai-summary, .ai-answer')).toBeVisible({ timeout: 15_000 });
};

test('Início mostra o pulso da rede e as ocorrências ativas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pulso da rede' })).toBeVisible();
  await expect(page.locator('.home-now li')).toHaveCount(6);
});

test('Relatórios: capas geradas, categoria e lista; workspace Comercial preservado', async ({ page }) => {
  await page.goto('/reports');
  await expect(page.locator('.rp-grid .rp-card')).toHaveCount(10);
  await expect(page.locator('.rp-cover img').first()).toHaveAttribute('src', /^data:image/);
  await page.getByRole('tab', { name: /Engenharia/ }).click();
  await expect(page.locator('.rp-grid .rp-card')).toHaveCount(3);
  await page.getByRole('radio', { name: 'Lista' }).click();
  await expect(page.locator('.rp-list .rp-row:not(.rp-row--head)')).toHaveCount(3);
  await page.getByRole('button', { name: /Workspace: Operações de Rede/ }).click();
  await page.getByRole('menuitem', { name: /Comercial/ }).click();
  await expect(page.getByText('12 relatórios no workspace Comercial')).toBeVisible();
});

test('Editor: dashboard do zero em menos de 2 minutos (inserir, arrastar, desfazer, visualizar, publicar)', async ({ page }) => {
  const t0 = Date.now();
  await page.goto('/reports');
  await page.getByRole('button', { name: 'Novo relatório' }).click();
  await expect(page.locator('.ed-emptypage')).toBeVisible();
  await page.locator('.ed-pal-item', { hasText: 'KPI' }).click();
  await page.locator('.ed-pal-item', { hasText: 'Barras' }).dragTo(page.locator('.ed-page'), { targetPosition: { x: 420, y: 320 } });
  await page.locator('.ed-pal-item', { hasText: 'Segmentação' }).click();
  await expect(page.locator('.ed-comp')).toHaveCount(3);
  // mover e desfazer
  const kpi = page.locator('.ed-comp[data-cid^="kpi"]');
  const a = (await kpi.boundingBox())!;
  await page.mouse.move(a.x + 40, a.y + 50); await page.mouse.down(); await page.mouse.move(a.x + 160, a.y + 90, { steps: 6 }); await page.mouse.up();
  const b = (await kpi.boundingBox())!;
  expect(Math.round(b.x - a.x)).toBeGreaterThan(50);
  await page.keyboard.press('Control+z');
  await expect.poll(async () => Math.round((await kpi.boundingBox())!.x - a.x)).toBe(0);
  // nome e publicar
  await page.locator('.ed-docname').fill('Meu painel de rede');
  await page.getByRole('radio', { name: 'Visualizar' }).click();
  await page.locator('.ed-comp[data-cid^="chart"] .vz-mark').first().click();
  await expect(page.locator('.ed-status-cross')).toBeVisible();
  await page.getByRole('radio', { name: 'Editar' }).click();
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Versão 1 publicada.')).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(120_000);
});

test('Copilot de construção: os 5 pedidos de demonstração alteram o documento', async ({ page }) => {
  await page.goto('/reports/net_executiva/edit');
  await page.locator('.ed-tabbtn', { hasText: 'IA' }).click();
  await askAi(page, 'Crie uma visão executiva da disponibilidade da rede.');
  await expect(page.locator('.ed-pagetabs [role=tab][aria-selected=true]')).toHaveText('Visão executiva');
  await expect(page.locator('.ed-comp')).toHaveCount(10);
  await askAi(page, 'Adicione um mapa mostrando os enlaces com maior atenuação.');
  await expect(page.locator('.ed-comp[data-type], .ed-comp')).toHaveCount(12);
  await page.locator('.ed-pagetabs [role=tab]', { hasText: 'Regiões' }).click();
  await askAi(page, 'Transforme essa tabela em uma visualização temporal.');
  await expect(page.locator('.ed-comp[data-cid="exe_16"]')).toHaveCount(0);
  await askAi(page, 'Crie uma página para acompanhar rompimentos de fibra.');
  await expect(page.locator('.ed-pagetabs [role=tab][aria-selected=true]')).toHaveText('Rompimentos de fibra');
  await page.locator('.ed-pagetabs [role=tab]', { hasText: 'Visão geral' }).click();
  await askAi(page, 'Organize esse dashboard deixando os indicadores mais importantes primeiro.');
  await expect(page.locator('.ai-msg').last()).toContainText('Reorganizei a página');
  // desfazer em um clique
  await page.locator('.ai-msg').last().getByRole('button', { name: 'Desfazer' }).click();
  await expect(page.locator('.ai-msg').last()).toContainText('Desfeito');
});

test('Regras: contagem ao vivo e efeito imediato nos componentes', async ({ page }) => {
  await page.goto('/reports/net_operacoes/edit');
  const atencao = page.locator('.vz-status-items button', { hasText: 'Atenção' }).first();
  const before = Number((await atencao.locator('b').innerText()).replace(/\D/g, ''));
  await page.locator('.ed-tabbtn', { hasText: 'Regras' }).click();
  await page.getByRole('button', { name: 'Nova regra' }).click();
  await expect(page.locator('.ed-rule-live b')).toHaveText(/^\d+$/);
  const live = await page.locator('.ed-rule-live b').innerText();
  await page.locator('.ed-cond-row input').first().fill('10');
  await expect(page.locator('.ed-rule-live b')).not.toHaveText(live);
  await expect.poll(async () => Number((await atencao.locator('b').innerText()).replace(/\D/g, ''))).toBeGreaterThan(before);
});

test('Importar rede (KMZ de exemplo) cria um dataset de rede', async ({ page }) => {
  await page.goto('/connections');
  await page.getByRole('button', { name: 'Importar dados' }).first().click();
  await page.getByRole('button', { name: /exemplo rede_sp\.kmz/ }).click();
  await expect(page.getByText(/128 nós · 346 enlaces · 42 regiões · 18 rotas/)).toBeVisible({ timeout: 8000 });
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Criar dataset de rede' }).click();
  await expect(page.getByText('Dataset criado.', { exact: false })).toBeVisible();
});

test('Mapa operacional: selecionar um enlace abre origem, destino e histórico', async ({ page }) => {
  await page.goto('/reports/net_operacoes');
  await page.locator('.vz-table .vz-tbody [role=row]').first().click();
  await expect(page.locator('.vz-detail')).toBeVisible();
  await expect(page.locator('.vz-detail')).toContainText('Origem');
  await expect(page.locator('.vz-detail')).toContainText('Destino');
});

test('IA desligada remove o Copilot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Exibição e preferências' }).click();
  await page.getByRole('switch', { name: /Copilot/ }).click({ force: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Copilot' })).toHaveCount(0);
});

for (const path of ['/', '/reports', '/reports/net_executiva', '/connections']) {
  test(`axe sem violações graves em ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(1500); // espera as animações de entrada terminarem
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
  });
}
