#!/usr/bin/env python3
"""N3·03 — Criptografía: reconocer y romper esquemas DÉBILES (concepto defensivo).
Enseña por qué ciertos esquemas (XOR de clave corta, César, hash sin sal) no protegen nada.
El alumno recupera mensajes de muestra creados aquí para entender qué NO usar jamás."""
import hashlib
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N3·03 · Por qué la criptografía débil no protege nada", 303)
r = lab.rng
FRASES = ["acceso concedido al panel", "la copia esta en el servidor", "reunion el martes a las diez",
          "clave del wifi de invitados", "informe trimestral adjunto"]

# 1) César con desplazamiento aleatorio
msg_cesar = r.choice(FRASES)
desp = r.randint(3, 23)
def cesar(s, k):
    return "".join(chr((ord(c) - 97 + k) % 26 + 97) if c.isalpha() else c for c in s)
lab.escribir("1_cesar.txt", "# Cifrado César (desplazamiento desconocido). Descífralo probando los 25 desplazamientos.\n" + cesar(msg_cesar, desp) + "\n")

# 2) XOR con clave de 1 byte
msg_xor = r.choice([f for f in FRASES if f != msg_cesar])
key = r.randint(1, 255)
xored = bytes(b ^ key for b in msg_xor.encode())
lab.escribir("2_xor.hex", "# XOR con clave de 1 byte (256 posibilidades). La salida está en hex.\n" + xored.hex() + "\n")

# 3) hashes MD5 sin sal de contraseñas comunes -> se rompen con un diccionario al instante
comunes = ["123456", "password", "qwerty", "admin", "iloveyou", "dragon", "monkey", "letmein", "football", "princess"]
elegidas = r.sample(comunes, 4)
lab.escribir("3_hashes_md5.txt", "\n".join(hashlib.md5(p.encode()).hexdigest() for p in elegidas) + "\n")
lab.escribir("3_diccionario.txt", "\n".join(comunes) + "\n")
# ¿cuál es la más repetida si dos usuarios reutilizan? Añadimos reutilización
reutilizada = elegidas[0]
lab.escribir("3_hashes_md5.txt", "\n".join(hashlib.md5(p.encode()).hexdigest() for p in (elegidas + [reutilizada, reutilizada])) + "\n")

# 4) el mismo mensaje con y sin sal: mostrar que sin sal los iguales coinciden
lab.escribir("4_sin_sal.txt",
             "# Tres usuarios, misma contraseña 'verano2026', hash MD5 SIN sal:\n" +
             "\n".join(hashlib.md5(b"verano2026").hexdigest() for _ in range(3)) +
             "\n# ¿Ves que los tres hashes son idénticos? Por eso hace falta sal (salt) única por usuario.\n")

lab.pregunta("Mensaje 1 (César): escríbelo descifrado.", msg_cesar,
             pista="for k in $(seq 1 25); do echo $k: $(cat 1_cesar.txt | tail -1 | tr 'a-z' ...); done  — o usa Python con el bucle de 0 a 25.")
lab.pregunta("¿Qué desplazamiento de César se usó? (1-25)", desp,
             pista="El que produzca texto legible en español.")
lab.pregunta("Mensaje 2 (XOR 1 byte): escríbelo descifrado.", msg_xor,
             pista="Prueba las 256 claves: for k in range(256): bytes(b^k for b in datos).")
lab.pregunta("¿Qué valor de clave (0-255) se usó en el XOR?", key)
lab.pregunta("En 3_hashes_md5.txt, ¿qué contraseña está REPETIDA (aparece 3 veces)?", reutilizada,
             pista="Hashea cada palabra del diccionario y cuenta cuál hash sale más veces en el fichero.")
lab.pregunta("¿Cuántas contraseñas DISTINTAS hay en 3_hashes_md5.txt?", 4,
             pista="sort 3_hashes_md5.txt | uniq | wc -l")
lab.pregunta("En 4_sin_sal.txt, ¿por qué es un problema que los tres hashes sean iguales? (una palabra: la solución que falta)", "sal",
             "salt", pista="Si dos usuarios con la misma contraseña tienen el mismo hash, basta romper uno. La solución es una sal única por usuario.")
lab.pregunta("¿Qué algoritmo moderno SÍ deberías usar para guardar contraseñas? (uno: bcrypt, scrypt o argon2)", "argon2",
             "bcrypt", "scrypt", pista="Son funciones lentas y con sal incorporada, diseñadas para contraseñas. Argon2 es el estándar recomendado actual.")
lab.terminar()
