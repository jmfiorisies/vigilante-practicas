#!/bin/bash
# Se ejecuta en la web al acabar ./lab.sh incidente: apunta en /etc/lab/verdad (solo root) lo que de verdad pasó,
# sacado de los registros y de los ficheros. Es lo que usa el comprobador del bloque B.
set -u
f=/etc/lab/verdad
h() { cut -c12-19; }
{
  echo "IP=198.18.40.66"
  echo "USUARIO=citas"
  echo "CLAVE=dientes2026"
  echo "PROC=dbus-helper"
  echo "RUTA=/var/tmp/.font-unix/dbus-helper"
  echo "C2=198.18.40.66:8443"
  echo "WS1=/var/www/html/uploads/radiografia.php"
  echo "WS2=/var/www/html/uploads/.thumbs.php"
  echo "EICAR=/var/www/html/uploads/presupuesto-1207.pdf"
  echo "HASH=$(sha256sum /var/www/html/uploads/radiografia.php | cut -d' ' -f1)"
  echo "PRIMER=$(grep -m1 'Failed password.*198\.18\.40\.66' /var/log/auth.log | h)"
  echo "ACCESO=$(grep -m1 'Accepted password.*198\.18\.40\.66' /var/log/auth.log | h)"
  echo "CREADA=$(date -u -d @"$(stat -c %Y /var/www/html/uploads/radiografia.php)" +%H:%M:%S)"
  echo "USADA=$(grep -m1 'GET /uploads/radiografia.php?c=' /var/log/nginx/access.log | sed -E 's/.*:([0-9]{2}:[0-9]{2}:[0-9]{2}) .*/\1/')"
} > "$f"
chmod 600 "$f"
date -u +%H:%M:%S > /etc/lab/incidente
