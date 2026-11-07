"""Utilidades comunes de las prácticas de CiberLab.

Cada práctica tiene:
  generar.py    crea los datos en datos/ (reproducible con --semilla N) y la plantilla respuestas.txt
  comprobar.py  corrige respuestas.txt sin mostrar las soluciones (se guardan como hashes)
Solo usa la biblioteca estándar de Python.
"""
import datetime as dt
import hashlib
import json
import pathlib
import random
import sys
import unicodedata

VERDE, ROJO, AMARILLO, GRIS, FIN = "\033[32m", "\033[31m", "\033[33m", "\033[90m", "\033[0m"


def norm(valor):
    s = unicodedata.normalize("NFKD", str(valor)).encode("ascii", "ignore").decode()
    return " ".join(s.strip().strip("\"'").lower().split())


def huella(valor):
    return hashlib.sha256(norm(valor).encode()).hexdigest()


def semilla_args(defecto):
    if "--semilla" in sys.argv:
        return int(sys.argv[sys.argv.index("--semilla") + 1])
    return defecto


class Lab:
    def __init__(self, fichero, titulo, semilla):
        self.dir = pathlib.Path(fichero).resolve().parent
        self.datos = self.dir / "datos"
        self.datos.mkdir(exist_ok=True)
        self.titulo = titulo
        self.semilla = semilla_args(semilla)
        self.rng = random.Random(self.semilla)
        self.preguntas = []

    # ---------- datos
    def escribir(self, nombre, texto):
        p = self.datos / nombre
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(texto, encoding="utf-8")
        return p

    def ip_externa(self):
        red = self.rng.choice(["203.0.113", "198.51.100", "192.0.2"])
        return f"{red}.{self.rng.randint(2, 254)}"

    def ip_interna(self, red="10.10.20"):
        return f"{red}.{self.rng.randint(20, 220)}"

    def hora(self, base, seg_max):
        return base + dt.timedelta(seconds=self.rng.randint(0, seg_max))

    # ---------- preguntas
    def pregunta(self, texto, respuesta, *alternativas, pista=""):
        self.preguntas.append({"t": texto, "h": [huella(r) for r in (respuesta, *alternativas)], "pista": pista})

    def terminar(self, extra=None):
        sol = {"titulo": self.titulo, "semilla": self.semilla, "preguntas": self.preguntas, **(extra or {})}
        (self.dir / ".soluciones.json").write_text(json.dumps(sol, ensure_ascii=False, indent=1), encoding="utf-8")
        resp = self.dir / "respuestas.txt"
        if resp.exists() and "--semilla" not in sys.argv and "--forzar" not in sys.argv:
            print(f"{GRIS}respuestas.txt ya existe: no lo toco (usa --forzar para rehacerlo).{FIN}")
        else:
            lineas = [f"# {self.titulo}", "# Escribe cada respuesta detrás de los dos puntos y ejecuta: python3 comprobar.py", ""]
            for i, p in enumerate(self.preguntas, 1):
                lineas += [f"# {i}. {p['t']}", f"{i}: ", ""]
            resp.write_text("\n".join(lineas), encoding="utf-8")
        print(f"{VERDE}✔ Datos generados en {self.datos}{FIN} (semilla {self.semilla})")
        print(f"  {len(self.preguntas)} preguntas en respuestas.txt · corrige con: python3 comprobar.py")


def comprobar(fichero, extra=None):
    """Corrige respuestas.txt. `extra` es una función opcional (dir, sol) -> (aciertos, total) para pruebas propias."""
    d = pathlib.Path(fichero).resolve().parent
    sol_p = d / ".soluciones.json"
    if not sol_p.exists():
        sys.exit(f"{ROJO}Primero genera los datos: python3 generar.py{FIN}")
    sol = json.loads(sol_p.read_text(encoding="utf-8"))
    resp = {}
    rp = d / "respuestas.txt"
    if rp.exists():
        for linea in rp.read_text(encoding="utf-8").splitlines():
            if linea.strip() and not linea.lstrip().startswith("#") and ":" in linea:
                k, v = linea.split(":", 1)
                if k.strip().isdigit():
                    resp[int(k)] = v.strip()
    ver_pistas = "--pistas" in sys.argv
    print(f"\n  {sol['titulo']}  {GRIS}(semilla {sol['semilla']}){FIN}\n")
    ok = 0
    for i, p in enumerate(sol["preguntas"], 1):
        r = resp.get(i, "")
        if not r:
            print(f"  {AMARILLO}·{FIN} {i}. {p['t']}  {GRIS}(sin responder){FIN}")
        elif huella(r) in p["h"]:
            ok += 1
            print(f"  {VERDE}✔{FIN} {i}. {p['t']}")
        else:
            print(f"  {ROJO}✘{FIN} {i}. {p['t']}  {GRIS}(tu respuesta: {r}){FIN}")
        if ver_pistas and p.get("pista") and huella(r) not in p["h"]:
            print(f"      {GRIS}pista: {p['pista']}{FIN}")
    total = len(sol["preguntas"])
    if extra:
        a, t = extra(d, sol)
        ok, total = ok + a, total + t
    color = VERDE if ok == total else AMARILLO if ok >= total / 2 else ROJO
    print(f"\n  {color}Puntuación: {ok}/{total}{FIN}")
    if ok == total:
        print(f"  {VERDE}¡Práctica superada! Pasa a la siguiente.{FIN}")
    elif not ver_pistas:
        print(f"  {GRIS}¿Atascado? python3 comprobar.py --pistas{FIN}")
    print()
    return ok, total


def marca(ok, texto, detalle=""):
    print(f"  {VERDE + '✔' if ok else ROJO + '✘'}{FIN} {texto}" + (f"  {GRIS}{detalle}{FIN}" if detalle and not ok else ""))
    return 1 if ok else 0
