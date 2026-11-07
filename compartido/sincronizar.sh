#!/usr/bin/env bash
# Copia el glosario, los comandos y la vista compartida a las dos apps y a la web.
set -eu
cd "$(dirname "$(readlink -f "$0")")/.."
for d in laboratorio_n1/app/ciberlab/static laboratorio_n2/app/ciberlab2/static; do
    cp compartido/glosario.js compartido/comandos.js compartido/herramientas.js "$d/content/"
    cp compartido/glosario-vista.js "$d/js/glosario.js"
done
mkdir -p docs/assets
cp compartido/glosario.js compartido/comandos.js compartido/herramientas.js docs/assets/
echo "Sincronizado: apps N1 y N2 + docs/assets"
