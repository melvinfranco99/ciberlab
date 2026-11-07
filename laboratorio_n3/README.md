# CiberLab N3 — laboratorio ofensivo / Red Team

Tercer nivel de CiberLab, centrado en **ciberseguridad ofensiva** (pentesting y emulación de adversario).
Mismo motor que el N1 y el N2 (servidor Python de la biblioteca estándar en `127.0.0.1`, SPA sin dependencias),
con contenido reorganizado como una **cadena de ataque** y foco experto.

> ⚠️ **Solo uso autorizado.** Todo se practica en tu laboratorio aislado, en plataformas creadas para ello
> (HTB, TryHackMe, VulnLab, PortSwigger) o contra sistemas de un cliente con contrato, alcance y reglas de
> enfrentamiento firmadas. Atacar sistemas sin permiso es un delito. El contenido es formativo y, en cada
> técnica ofensiva, explica **cómo se detecta y se mitiga**.

## Escritorios (cadena de ataque)
1. **Ruta ofensiva y método** — PTES/OSSTMM/ATT&CK, alcance y RoE, montaje del laboratorio.
2. **Reconocimiento y OSINT** · **Técnicas ATT&CK**.
3. **Acceso inicial** — explotación de servicios y *password spraying*.
4. **Escalada de privilegios** — Linux (SUID, sudo, cron) y Windows (tokens, servicios).
5. **Active Directory ofensivo** — BloodHound, Kerberoasting, delegación.
6. **Post-explotación y C2** · **Evasión y OPSEC** (con su detección).
7. **Explotación web avanzada** — SSRF, SSTI, deserialización.
8. **Laboratorio N3** (VMs + Docker) **e** **Informe de pentest**.

Más: **Glosario**, **Comandos** y **Herramientas** (compartidos con N1/N2, búsqueda con `/`).

## Puertos y redes (independientes de N1 y N2)
- Servidor: `127.0.0.1:8768` (variable `CIBERLAB3_PORT`).
- Redes host-only aisladas del laboratorio: **CORP** `192.168.59.0/24`, **DMZ** `192.168.60.0/24`.
- Labs Docker en `127.0.0.1:8220`–`8224` (Juice Shop, DVWA, WebGoat, VAmPI, CyberChef).

## Uso
```bash
app/bin/ciberlab3                 # abre la app (vista 'inicio')
app/bin/ciberlab3 --escritorios   # un programa por escritorio (bspwm/EWMH)
app/bin/ciberlab3-mode toggle     # activa/desactiva el modo (apaga N1 y N2)
app/bin/ciberlab3 --stop          # detiene el servidor
```

## Estructura
- `app/bin/ciberlab3`, `app/bin/ciberlab3-mode`: lanzador y modo bspwm.
- `app/ciberlab3/`: servidor, labs Docker (`labs.py`) y VMs (`vbox.py`).
- `app/ciberlab3/static/content/*.js`: contenido de las áreas (edítalo o amplíalo).
- Datos: progreso y apuntes en `~/.local/share/ciberlab3/`; trabajo de operación en `~/CiberLab3/`.
