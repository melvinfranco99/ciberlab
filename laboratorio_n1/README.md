# CiberLab — entorno de ciberseguridad para bspwm

📖 **Manual paso a paso:** https://melvinfranco99.github.io/ciberlab/

Botón **󰚌** en el módulo `envmode` de polybar (junto a normal · privado · paranoico · finanzas).

| Acción | Resultado |
|---|---|
| Clic izquierdo | Activa/desactiva el modo: fondo propio + un programa por escritorio |
| Clic derecho | Abre el Laboratorio (VMs) |
| Botón «normal» 󰍹 | Sale de cualquier modo, incluido este |

## Escritorios
1. Ruta y fundamentos · 2. Ofensiva y Red Team · 3. Hacking web · 4. Vulnerabilidades ·
5. Blue Team y logs (con práctica de análisis de logs) · 6. Redes y WiFi · 7. Cloud y servidores ·
8. Laboratorio (VMs VirtualBox + labs Docker) **y** Auditorías

## Estructura
- `app/bin/ciberlab`: lanzador (`--server`, `--stop`, `--escritorios`, `[vista]`)
- `app/bin/ciberlab-mode`: `on | off | toggle | status`
- `app/ciberlab/`: servidor Python solo con la biblioteca estándar, en `127.0.0.1:8766`, con token por sesión y validación de Host/Origin
- `app/ciberlab/static/content/*.js`: contenido de las lecciones (edítalo o amplíalo)
- Datos: progreso y apuntes en `~/.local/share/ciberlab/`; auditorías y evidencias en `~/CiberLab/`

## Instalación (ya hecha)
- `~/.local/bin/ciberlab` y `~/.local/bin/ciberlab-mode` son enlaces simbólicos a `app/bin/`
- `~/.config/bspwm/bin/EnvMode` modificado; el original está en `EnvMode.bak-ciberlab`

Para deshacerlo:
```bash
cp -p ~/.config/bspwm/bin/EnvMode.bak-ciberlab ~/.config/bspwm/bin/EnvMode
rm ~/.local/bin/ciberlab ~/.local/bin/ciberlab-mode
```
