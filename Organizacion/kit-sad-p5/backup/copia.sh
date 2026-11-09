#!/bin/bash
# Copia de seguridad de La Taquilla. La lanzas con  ./lab.sh copia  y, cada 6 horas, la lanza cron.
# Se ejecuta DENTRO de la máquina datos: /srv/taquilla son los datos, /mnt/usb el disco externo, /lab esta carpeta.
set -e
export RESTIC_PASSWORD_FILE=/lab/clave          # 👀 la contraseña de los repositorios (✍️ C1: escríbela en backup/clave)
LOCAL=/mnt/usb/taquilla                         # 👀 el repositorio en el disco externo
NUBE=rest:http://taquilla:Nube-Taquilla-27@198.18.70.50:8000/taquilla/   # 👀 el repositorio fuera de la sede

echo "== $(date '+%F %T') · copia en el disco externo"
# ✍️ C2 · Copia /srv/taquilla SIN lo que dice excluir.txt y con la etiqueta «nocturna»
restic -r "$LOCAL" backup /srv/taquilla

echo "== Retención"
# ✍️ C3 · Guarda 14 diarias, 8 semanales y 6 mensuales, y libera el espacio de las demás (solo en el disco externo)


echo "== Copia fuera de la sede"
# ✍️ C4 · La misma copia, en la nube


echo "== Comprobación"
restic -r "$LOCAL" check                        # 👀 que el repositorio está sano
