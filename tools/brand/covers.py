"""Capas 16:9 dos relatórios. Motivo da marca: barras inclinadas de cantos arredondados (como o símbolo BIWEB)
sobre um campo sólido com a grade pontilhada do canvas. Sem texto na imagem: o título fica no card."""
import sys, math, random
from PIL import Image, ImageDraw
OUT = sys.argv[1]; MARK = sys.argv[2]
W, H, K = 1200, 675, 2
NAVY, BLUE, TEAL, SLATE = (21, 50, 99), (64, 163, 201), (22, 188, 216), (84, 111, 147)
INK, MIST = (12, 27, 54), (226, 238, 246)
def mix(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
def base(bg, dots=(255, 255, 255, 22)):
    im = Image.new('RGBA', (W * K, H * K), bg + (255,)); d = ImageDraw.Draw(im)
    for y in range(24 * K, H * K, 24 * K):
        for x in range(24 * K, W * K, 24 * K): d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=dots)
    return im
def slant(d, x, y, w, h, fill, skew=0.32, r=14):
    """Barra inclinada como as peças do símbolo: topo sobe para a direita."""
    x, y, w, h, r = x * K, y * K, w * K, h * K, r * K
    dy = w * skew
    pts = [(x, y + dy), (x + w, y), (x + w, y + h), (x, y + h)]
    d.polygon(pts, fill=fill)
    # cantos suavizados
    d.rounded_rectangle((x, y + dy + r, x + w, y + h), radius=r, fill=fill)
def bars(im, vals, x0, y0, w, h, cols, gap=18, skew=0.32):
    d = ImageDraw.Draw(im); n = len(vals); bw = (w - gap * (n - 1)) / n; mx = max(vals)
    for i, v in enumerate(vals):
        bh = h * v / mx; slant(d, x0 + i * (bw + gap), y0 + h - bh, bw, bh, cols[i % len(cols)] + (255,), skew)
def line(im, vals, x0, y0, w, h, col, width=8, dot=True):
    d = ImageDraw.Draw(im); mx, mn = max(vals), min(vals) * 0.85
    pts = [((x0 + w * i / (len(vals) - 1)) * K, (y0 + h - h * (v - mn) / (mx - mn)) * K) for i, v in enumerate(vals)]
    area = [(pts[0][0], (y0 + h) * K)] + pts + [(pts[-1][0], (y0 + h) * K)]
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(ov).polygon(area, fill=col + (46,)); im.alpha_composite(ov)
    d.line(pts, fill=col + (255,), width=width * K, joint='curve')
    if dot:
        for p in pts: d.ellipse((p[0] - 9 * K, p[1] - 9 * K, p[0] + 9 * K, p[1] + 9 * K), fill=col + (255,), outline=INK + (255,), width=3 * K)
def tiles(im, x0, y0, cell, grid, cols):
    d = ImageDraw.Draw(im)
    for (c, r), lvl in grid.items():
        x, y = (x0 + c * cell) * K, (y0 + r * cell) * K
        d.rounded_rectangle((x, y, x + (cell - 8) * K, y + (cell - 8) * K), radius=8 * K, fill=cols[lvl] + (255,))
def rings(im, cx, cy, rs, cols, fracs):
    d = ImageDraw.Draw(im)
    for r, c, f in zip(rs, cols, fracs):
        box = ((cx - r) * K, (cy - r) * K, (cx + r) * K, (cy + r) * K)
        d.arc(box, 0, 360, fill=mix(c, INK, .55) + (255,), width=30 * K)
        d.arc(box, -90, -90 + 360 * f, fill=c + (255,), width=30 * K)
def mark(im, alpha=60, size=96, pos='br'):
    m = Image.open(MARK).convert('RGBA'); m = m.resize((size * K, round(m.height * size / m.width) * K), Image.LANCZOS)
    a = m.split()[3].point(lambda v: v * alpha // 255); m.putalpha(a)
    x = (W - size - 48) * K if pos == 'br' else 48 * K; y = (H - m.height // K - 44) * K
    im.alpha_composite(m, (x, y))
def save(im, name):
    im = im.resize((W, H), Image.LANCZOS).convert('RGB'); im.save(f'{OUT}/{name}.webp', quality=86, method=6)
    im.resize((480, 270), Image.LANCZOS).save(f'{OUT}/{name}-sm.webp', quality=84, method=6)

meses = [1.85, 1.92, 2.10, 2.05, 2.18, 2.25, 2.31, 2.22, 1.52]
P_V = [TEAL, BLUE, mix(BLUE, SLATE, .5), SLATE]
# 1 Visão executiva: barras mensais (queda de setembro em destaque)
im = base(NAVY); bars(im, meses, 120, 150, 780, 400, [TEAL] * 8 + [mix(TEAL, NAVY, .55)]); mark(im); save(im, 'visao-executiva')
# 2 Desempenho por região: barras de região decrescentes
im = base(mix(NAVY, SLATE, .35)); bars(im, [8.1, 3.9, 3.6, 1.7, 1.1], 140, 140, 640, 420, [TEAL, BLUE, BLUE, SLATE, SLATE], gap=26); mark(im); save(im, 'desempenho-regiao')
# 3 Estoque e ruptura: linha com pico de ruptura
im = base(INK); line(im, [4.1, 4.4, 4.0, 4.6, 4.3, 4.9, 5.1, 4.8, 14.2], 110, 170, 860, 360, TEAL); mark(im); save(im, 'estoque-ruptura')
# 4 Clientes e retenção: anéis
im = base(mix(NAVY, BLUE, .25)); rings(im, 420, 330, [210, 150, 90], [TEAL, BLUE, MIST], [.78, .61, .42]); mark(im); save(im, 'clientes-retencao')
# 5 Mapa de lojas: mosaico de estados
UF = {(1,0):1,(3,0):1,(1,1):1,(2,1):1,(3,1):1,(4,1):2,(5,1):1,(0,2):1,(1,2):1,(2,2):2,(3,2):1,(4,2):1,(5,2):1,(6,2):2,(2,3):1,(3,3):2,(4,3):1,(5,3):3,(6,3):1,(2,4):3,(3,4):4,(4,4):3,(5,4):1,(6,4):1,(2,5):3,(4,5):3,(2,6):3}
im = base(NAVY); tiles(im, 380, 70, 76, UF, [None, mix(SLATE, NAVY, .3), SLATE, BLUE, TEAL]); mark(im); save(im, 'mapa-lojas')
# 6 Margem (antigo, depreciado): tons dessaturados
im = base((58, 66, 80), (255, 255, 255, 14)); bars(im, [6.2, 4.3, 3.5, 2.6, 1.8], 160, 170, 560, 360, [(122, 134, 150), (104, 116, 132)], gap=24); mark(im, 40); save(im, 'margem-antigo')
# 7 Fechamento de setembro: barras divergentes por categoria
im = base(INK); d = ImageDraw.Draw(im)
for i, v in enumerate([.41, .12, .09, .05, .03]):
    w = 700 * v / .41; slant(d, 980 - w, 130 + i * 92, w, 56, (TEAL if i == 0 else BLUE) + (255,), skew=0.04, r=10)
mark(im, pos='bl'); save(im, 'fechamento-setembro')
# 8 Ranking de produtos: barras horizontais
im = base(mix(NAVY, INK, .4)); d = ImageDraw.Draw(im)
for i, v in enumerate([1.42, .98, .87, .84, .71]):
    w = 820 * v / 1.42; slant(d, 110, 130 + i * 90, w, 54, mix(TEAL, BLUE, i / 4) + (255,), skew=0.02, r=10)
mark(im); save(im, 'ranking-produtos')
# 9 Canais de venda: 48 · 37 · 15 em blocos proporcionais
im = base(NAVY); d = ImageDraw.Draw(im); x = 110
for v, c in [(48, TEAL), (37, BLUE), (15, SLATE)]:
    w = 900 * v / 100 - 16; slant(d, x, 190, w, 300, c + (255,), skew=0.18, r=16); x += w + 16
mark(im); save(im, 'canais-venda')
# 10 Apresentação ao comitê: slides empilhados
im = base(mix(SLATE, NAVY, .55)); d = ImageDraw.Draw(im)
for i, c in enumerate([mix(SLATE, NAVY, .2), BLUE, MIST]):
    x, y = 220 + i * 60, 140 + i * 50
    d.rounded_rectangle((x * K, y * K, (x + 600) * K, (y + 340) * K), radius=14 * K, fill=c + (255,))
bars(im, [3, 4, 3.4, 5, 4.4], 400, 330, 330, 150, [NAVY], gap=20); mark(im); save(im, 'apresentacao-comite')
# 11 Análise da queda (gerado com Copilot): linha mensal + ponto de setembro
im = base(INK); line(im, meses, 110, 150, 860, 380, BLUE); d = ImageDraw.Draw(im)
px, py = (110 + 860) * K, (150 + 380 - 380 * (1.52 - 1.52 * .85) / (2.31 - 1.52 * .85)) * K
d.ellipse((px - 22 * K, py - 22 * K, px + 22 * K, py + 22 * K), outline=TEAL + (255,), width=5 * K); mark(im); save(im, 'analise-queda')
# 12 Metas 2026: barras de atingimento com linha de meta
im = base(mix(NAVY, BLUE, .15)); bars(im, [9.4, 8.1, 10.2, 7.6, 8.8], 150, 170, 640, 360, [BLUE, TEAL], gap=28)
d = ImageDraw.Draw(im); d.line((130 * K, 230 * K, 830 * K, 230 * K), fill=MIST + (220,), width=4 * K); mark(im); save(im, 'metas-2026')
print('ok')
