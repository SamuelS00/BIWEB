import sys, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
def trim(p):
    im = Image.open(p).convert('RGBA'); return im.crop(im.split()[3].getbbox())
def save(im, name, w=None, h=None):
    if w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if h: im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    im.save(f'{out}/{name}.png', optimize=True); im.save(f'{out}/{name}.webp', quality=92, method=6)
    print(name, im.size, os.path.getsize(f'{out}/{name}.webp'))
save(trim(f'{src}/img1.png'), 'logo-light', h=96)     # para fundos claros
save(trim(f'{src}/img2.png'), 'logo-dark', h=96)      # para fundos escuros
save(trim(f'{src}/img4.png'), 'logo-mono', h=96)      # monocromático (rodapé de relatório)
mark = trim(f'{src}/img3.png'); save(mark, 'mark', w=256)
save(trim(f'{src}/img5.png'), 'logo-stacked', w=320)
sq = Image.new('RGBA', (max(mark.size),) * 2, (0, 0, 0, 0)); sq.paste(mark, ((sq.width - mark.width) // 2, (sq.height - mark.height) // 2))
for s, n in [(64, 'favicon'), (180, 'apple-touch-icon')]:
    sq.resize((s, s), Image.LANCZOS).save(f'{out}/{n}.png', optimize=True)
