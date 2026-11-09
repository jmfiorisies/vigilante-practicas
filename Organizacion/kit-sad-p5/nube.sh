#!/bin/bash
# (Re)arranca rest-server con las opciones de /etc/nube/opciones (OPCIONES="…")
OPCIONES=""
[ -f /etc/nube/opciones ] && . /etc/nube/opciones
pkill -x restic-rest-ser 2>/dev/null; sleep 0.5
nohup restic-rest-server --path /datos --listen :8000 $OPCIONES >/var/log/rest-server.log 2>&1 &
sleep 1
pgrep -f restic-rest-server >/dev/null
