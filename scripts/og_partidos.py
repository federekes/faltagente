# Genera p/<id>.html y p/<id>.jpg con vista previa (WhatsApp) para cada partido de Firestore.
import json, os, urllib.request, datetime, hashlib, html
from PIL import Image, ImageDraw, ImageFont
BASE = 'https://federekes.github.io/faltagente'
URL = 'https://firestore.googleapis.com/v1/projects/faltagente/databases/(default)/documents/partidos?pageSize=300'
F_ANTON = 'scripts/Anton-Regular.ttf'; F_BAR = 'scripts/BarlowCondensed-SemiBold.ttf'

def val(v):
    if v is None: return None
    for k in ('stringValue', 'integerValue', 'doubleValue', 'booleanValue', 'timestampValue'):
        if k in v: return v[k]
    if 'mapValue' in v: return {k: val(x) for k, x in v['mapValue'].get('fields', {}).items()}
    if 'arrayValue' in v: return [val(x) for x in v['arrayValue'].get('values', [])]
    return None

def partidos():
    docs, url = [], URL
    while url:
        d = json.load(urllib.request.urlopen(url))
        docs += d.get('documents', [])
        url = URL + '&pageToken=' + d['nextPageToken'] if d.get('nextPageToken') else None
    for doc in docs:
        yield doc['name'].split('/')[-1], {k: val(v) for k, v in doc.get('fields', {}).items()}

def fit(draw, text, font_path, size, maxw):
    while size > 20:
        f = ImageFont.truetype(font_path, size)
        if draw.textlength(text, font=f) <= maxw: return f
        size -= 4
    return ImageFont.truetype(font_path, size)

def imagen(p, falta, path):
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), (19, 35, 26)); d = ImageDraw.Draw(im)
    for x in range(0, W, 160): d.rectangle([x + 80, 0, x + 159, H], fill=(15, 28, 21))
    d.rectangle([0, H - 16, W, H], fill=(61, 220, 90))
    logo = Image.open('logo-512.png').convert('RGBA').resize((150, 150))
    im.paste(logo, (50, 40), logo)
    d.text((215, 70), 'FALTA GENTE', font=ImageFont.truetype(F_ANTON, 64), fill=(61, 220, 90))
    d.text((215, 140), (p.get('estilo') or '').upper(), font=ImageFont.truetype(F_BAR, 40), fill=(220, 230, 222))
    d.text((60, 230), f"{(p.get('dia') or '').upper()} {p.get('fecha') or ''} · {p.get('hora') or ''}", font=fit(d, f"{(p.get('dia') or '').upper()} {p.get('fecha') or ''} · {p.get('hora') or ''}", F_ANTON, 92, 1080), fill=(243, 245, 239))
    cancha = f"{p.get('cancha') or ''}"
    d.text((60, 350), cancha, font=fit(d, cancha, F_BAR, 56, 1080), fill=(243, 245, 239))
    dire = p.get('direccion') or ''
    d.text((60, 415), dire, font=fit(d, dire, F_BAR, 36, 1080), fill=(184, 196, 188))
    txt = '¡COMPLETO!' if falta <= 0 else ('¡FALTA 1!' if falta == 1 else f'FALTAN {falta}')
    col = (255, 176, 32) if falta == 1 else (61, 220, 90)
    d.text((60, 480), txt, font=ImageFont.truetype(F_ANTON, 96), fill=col)
    pr = f"${p.get('precio')}" if p.get('precio') else ''
    if pr:
        f = ImageFont.truetype(F_ANTON, 80); w = d.textlength(pr, font=f)
        d.text((W - 60 - w, 495), pr, font=f, fill=(243, 245, 239))
    im.save(path, 'JPEG', quality=84)

def main():
    os.makedirs('p', exist_ok=True)
    hoy = (datetime.datetime.utcnow() - datetime.timedelta(days=2)).strftime('%Y-%m-%d')
    vivos = set()
    for pid, p in partidos():
        if not p.get('fechaISO') or p['fechaISO'][:10] < hoy: continue
        cupo = int(p.get('cupo') or 10)
        n = len(p.get('jugadores') or {}) if not p.get('ejemplo') else cupo - int(p.get('libres') or 0)
        if p.get('ejemplo'): continue
        falta = max(0, cupo - n)
        vivos.add(pid)
        firma = hashlib.md5(json.dumps([p.get('estilo'), p.get('dia'), p.get('fecha'), p.get('hora'), p.get('cancha'), p.get('direccion'), p.get('precio'), falta], ensure_ascii=False).encode()).hexdigest()[:8]
        jpg, page = f'p/{pid}.jpg', f'p/{pid}.html'
        old = open(page).read() if os.path.exists(page) else ''
        if f'v={firma}' in old: continue
        imagen(p, falta, jpg)
        falta_txt = '¡Completo!' if falta <= 0 else ('¡Falta 1!' if falta == 1 else f'Faltan {falta}')
        t = html.escape(f"{falta_txt} {p.get('estilo','')} en {p.get('cancha','')}")
        desc = html.escape(f"{p.get('dia','').capitalize()} {p.get('fecha','')} a las {p.get('hora','')} · ${p.get('precio','')} por jugador. Entrá y anotate.")
        dest = f'../partido.html?id={pid}'
        open(page, 'w').write(f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{t} · Falta Gente</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website"><meta property="og:site_name" content="Falta Gente">
<meta property="og:title" content="{t}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}/p/{pid}.html">
<meta property="og:image" content="{BASE}/p/{pid}.jpg?v={firma}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url={dest}"><script>location.replace("{dest}")</script></head>
<body style="background:#13231A;color:#fff;font-family:sans-serif"><a href="{dest}" style="color:#3DDC5A">Ver el partido</a></body></html>''')
        print('generado', pid, falta_txt)
    for f in os.listdir('p'):
        if not f.startswith('.') and f.split('.')[0] not in vivos: os.remove(os.path.join('p', f))

main()
