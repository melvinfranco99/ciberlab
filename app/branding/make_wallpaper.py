#!/usr/bin/env python3
"""Genera el fondo de CiberLab: make_wallpaper.py salida.svg ANCHO ALTO"""
import random
import sys

out, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
rnd = random.Random(42)
cols = []
for x in range(0, w, 22):
    if rnd.random() < .35:
        y0 = rnd.randint(-h // 2, h)
        chars = "".join(rnd.choice("01アイウエオカキクケコ/{}#$=") for _ in range(rnd.randint(8, 30)))
        op = rnd.uniform(.04, .16)
        cols.append(f'<text x="{x}" y="{y0}" fill="#00fa5c" fill-opacity="{op:.2f}" font-family="monospace" '
                    f'font-size="16" writing-mode="tb">{chars}</text>')
cx, cy, s = w // 2, h // 2, min(w, h) / 1080
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><radialGradient id="r" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#0d1a14"/><stop offset="1" stop-color="#05070a"/></radialGradient>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00fa5c"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
<rect width="{w}" height="{h}" fill="url(#r)"/>{"".join(cols)}
<g transform="translate({cx - 90 * s},{cy - 150 * s}) scale({2.8 * s})" opacity=".9">
<path d="M32 4 8 13v17c0 15 10 26 24 30 14-4 24-15 24-30V13Z" fill="#0b0f14" stroke="url(#g)" stroke-width="2.5"/>
<path d="M22 27a10 10 0 0 1 20 0v4h-20z" fill="none" stroke="url(#g)" stroke-width="2.5"/>
<rect x="18" y="30" width="28" height="18" rx="3" fill="url(#g)"/></g>
<text x="{cx}" y="{cy + 90 * s}" text-anchor="middle" fill="#cfd9e3" font-family="JetBrains Mono, monospace" font-size="{54 * s:.0f}" font-weight="700">Ciber<tspan fill="#00fa5c">Lab</tspan></text>
<text x="{cx}" y="{cy + 135 * s}" text-anchor="middle" fill="#61748a" font-family="JetBrains Mono, monospace" font-size="{20 * s:.0f}">aprende · practica · audita — solo con autorización</text>
</svg>'''
open(out, "w").write(svg)
