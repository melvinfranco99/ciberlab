#!/usr/bin/env python3
"""N4·02 — Ingeniería de detección: escribir reglas que cacen la técnica, no el indicador.
Entrega eventos (JSONL estilo Sysmon/EDR) con actividad benigna y maliciosa mezcladas.
El alumno diseña el filtro y mide verdaderos/falsos positivos: aprende a afinar una detección."""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N4·02 · Ingeniería de detección (TP/FP y afinado)", 402)
r = lab.rng
eventos = []


def e(image, parent, cmd, maligno):
    eventos.append({"EventID": 1, "Image": image, "ParentImage": parent, "CommandLine": cmd, "_malicioso": maligno})


# Técnica objetivo: proceso de Office que engendra un intérprete (T1059). Maligno.
office = [r"C:\Program Files\Microsoft Office\WINWORD.EXE", r"C:\Program Files\Microsoft Office\EXCEL.EXE",
          r"C:\Program Files\Microsoft Office\OUTLOOK.EXE"]
shells = ["powershell.exe", "cmd.exe", "wscript.exe", "mshta.exe"]
n_mal = r.randint(8, 14)
for _ in range(n_mal):
    e(r"C:\Windows\System32\WindowsPowerShell\v1.0\\" + r.choice(shells) if False else f"C:\\Windows\\System32\\{r.choice(shells)}",
      r.choice(office), "-nop -w hidden -enc aQB3AHIA...", True)

# Benigno 1: Office que abre un navegador al pulsar un enlace (MISMO patrón padre Office -> hijo, pero hijo es el navegador). Falso positivo potencial.
n_fp1 = r.randint(10, 18)
for _ in range(n_fp1):
    e(r"C:\Program Files\Google\Chrome\chrome.exe", r.choice(office), "https://intranet/documento", False)

# Benigno 2: powershell lanzado por tareas programadas legítimas (padre = taskeng/svchost). No debe disparar.
n_fp2 = r.randint(15, 25)
for _ in range(n_fp2):
    e(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe", r"C:\Windows\System32\svchost.exe",
      "-File C:\\Scripts\\inventario.ps1", False)

# Benigno 3: ruido general
for _ in range(60):
    e(r"C:\Windows\System32\notepad.exe", r"C:\Windows\explorer.exe", "documento.txt", False)

r.shuffle(eventos)
lab.escribir("eventos.jsonl", "\n".join(json.dumps(x, ensure_ascii=False) for x in eventos) + "\n")

# Regla de referencia (buena): ParentImage termina en WINWORD/EXCEL/OUTLOOK Y Image es un intérprete de la lista.
interpretes = {"powershell.exe", "cmd.exe", "wscript.exe", "mshta.exe", "cscript.exe"}
def es_office(p): return any(p.upper().endswith(x) for x in ["WINWORD.EXE", "EXCEL.EXE", "OUTLOOK.EXE", "POWERPNT.EXE"])
def img_name(i): return i.replace("\\", "/").split("/")[-1].lower()

tp = sum(1 for x in eventos if es_office(x["ParentImage"]) and img_name(x["Image"]) in interpretes and x["_malicioso"])
fp = sum(1 for x in eventos if es_office(x["ParentImage"]) and img_name(x["Image"]) in interpretes and not x["_malicioso"])
# Regla ingenua (mala): "cualquier powershell" -> dispara con las tareas legítimas
ingenua_total = sum(1 for x in eventos if img_name(x["Image"]) == "powershell.exe")
ingenua_fp = sum(1 for x in eventos if img_name(x["Image"]) == "powershell.exe" and not x["_malicioso"])

lab.pregunta("¿Cuántos eventos hay en total en eventos.jsonl?", len(eventos), pista="wc -l eventos.jsonl")
lab.pregunta("Regla INGENUA 'Image = powershell.exe': ¿cuántos eventos dispara en total?", ingenua_total,
             pista="Cuenta todos los eventos cuyo Image acabe en powershell.exe.")
lab.pregunta("De esos, ¿cuántos son FALSOS POSITIVOS (powershell legítima de tareas programadas)?", ingenua_fp,
             pista="Las lanzadas por svchost.exe con -File inventario.ps1 son legítimas.")
lab.pregunta("Regla BUENA 'padre=Office Y hijo=intérprete': ¿cuántos VERDADEROS POSITIVOS caza?", tp)
lab.pregunta("¿Cuántos FALSOS POSITIVOS tiene la regla buena?", fp,
             pista="Office lanzando chrome.exe NO es un intérprete, así que no debería contar: idealmente 0.")
lab.pregunta("¿Qué regla es mejor para producción: la ingenua o la de padre Office + hijo intérprete?", "buena",
             "padre office", "la buena", pista="Menos falsos positivos y apunta al comportamiento real de la técnica.")
lab.pregunta("¿Cómo se llama el documento de detección que describe lógica, fuentes y pruebas (formato YAML abierto)? (una palabra)",
             "sigma", pista="El estándar abierto para reglas de detección de SIEM es Sigma.")
lab.terminar()
