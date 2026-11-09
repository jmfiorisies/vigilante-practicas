#!/usr/bin/env bash
#
# lab.sh — Mando a distancia de la Práctica 5 de SAD · La Taquilla
#          (bloque A: proxy y balanceo · bloque B: alta disponibilidad · bloque C: copias y continuidad).
#
# No necesitas saber Docker: todo lo que hace falta está aquí.
#   ./lab.sh ayuda        -> lista de órdenes
#
set -uo pipefail
cd "$(dirname "$0")"

MAQUINAS="proxy taquilla kiosko calle lb1 lb2 venta1 venta2 venta3 datos nuevo nube"
VIP=198.18.70.100
c() { echo "sad-p5-$1"; }
NUBE_URL="rest:http://taquilla:Nube-Taquilla-27@198.18.70.50:8000/taquilla/"
NUBE_HTTP="http://taquilla:Nube-Taquilla-27@198.18.70.50:8000/taquilla"
RETENCION_ESPERADA=24      # 14 diarias + 8 semanales + 6 mensuales sobre 120 días (medido con restic 0.18)
# Fechas (las del calendario): avance de A y B al acabar la UD10; entrega de los tres bloques; defensa
AVANCE_AB="dom 24/1, 23:59"; ENTREGA="lun 1/2, 23:59"; DEFENSA="mié 3/2"

# ---------- colores ----------
if [ -t 1 ]; then
    R=$'\e[1;31m'; V=$'\e[1;32m'; A=$'\e[1;33m'; Z=$'\e[1;34m'; N=$'\e[1m'; X=$'\e[0m'
else
    R=""; V=""; A=""; Z=""; N=""; X=""
fi
info()  { echo "${Z}▶${X} $*"; }
bien()  { echo "${V}✔${X} $*"; }
aviso() { echo "${A}!${X} $*"; }
error() { echo "${R}✘ $*${X}" >&2; }

necesita_docker() {
    if ! command -v docker >/dev/null 2>&1; then error "Docker no está instalado en este equipo."; exit 1; fi
    if ! docker info >/dev/null 2>&1; then
        error "Docker está instalado pero no puedo usarlo."
        echo "  - ¿Está arrancado?           sudo systemctl start docker"
        echo "  - ¿Tu usuario está en el grupo docker?  sudo usermod -aG docker \$USER  (y cierra sesión)"
        exit 1
    fi
}
corriendo() { [ "$(docker inspect -f '{{.State.Running}}' "$(c "$1")" 2>/dev/null)" = "true" ]; }
necesita_lab() {
    necesita_docker
    for m in $MAQUINAS; do
        if ! corriendo "$m"; then
            error "El laboratorio no está entero (falta «$m»)."
            case $m in lb1|lb2) echo "  Si la has tirado tú:  ./lab.sh levantar $m" ;; *) echo "  Arráncalo con:  ./lab.sh arrancar" ;; esac
            exit 1
        fi
    done
}
# Ejecuta una orden en una máquina («host» = en tu ordenador, para las pruebas que mueven varias máquinas)
en() { local m=$1; shift; if [ "$m" = host ]; then "$@"; else docker exec "$(c "$m")" "$@"; fi; }
hay_desastre() { en nube test -f /etc/lab/verdad 2>/dev/null; }

# Una prueba: descripción («A3 · …»), máquina y orden. Si la orden sale bien, ✔; si no, ✘ y la pista.
# Las 👀 son ejemplos resueltos: se enseñan, pero no cuentan.
OK_A=0; TOT_A=0; OK_B=0; TOT_B=0; OK_C=0; TOT_C=0
cuenta() { eval "TOT_$1=\$((TOT_$1 + 1))"; [ "$2" = 1 ] && eval "OK_$1=\$((OK_$1 + 1))"; return 0; }
prueba() {
    local desc=$1 maq=$2 orden=$3 pista=${4:-}
    if en "$maq" bash -c "$orden" >/dev/null 2>&1; then
        bien "$desc"; [[ $desc == 👀* ]] || cuenta "${desc:0:1}" 1; return 0
    else
        echo "${R}✘${X} $desc"; [ -n "$pista" ] && echo "    ${A}💡${X} $pista"
        [[ $desc == 👀* ]] || cuenta "${desc:0:1}" 0; return 1
    fi
}

ayuda() {
    cat <<EOF
${N}Práctica 5 de SAD · La Taquilla${X}

  Oficina 10.70.0.0/24          «Internet» 198.18.70.0/24                 Servicios 10.70.1.0/24
  taquilla .20 ─┐                               ┌─ lb1 .11 ─┐
  kiosko   .30 ─┴─ proxy .2 ──── calle .80 ─────┤  IP .100  ├──── venta1 .21 · venta2 .22 · venta3 .23
                                    nube .50    └─ lb2 .12 ─┘     datos .30 (disco externo) · nuevo .40

${N}Arrancar y parar${X}
  ./lab.sh arrancar        crea y arranca las 12 máquinas (la primera vez tarda unos minutos)
  ./lab.sh parar           las apaga (tus ficheros se quedan en esta carpeta)
  ./lab.sh reiniciar       las crea de nuevo DESDE CERO (borra la caché, los registros, el disco externo y la nube)
  ./lab.sh estado          qué máquinas están en marcha y quién tiene la IP de la tienda

${N}Entrar en una máquina${X} (sales con exit)
  ./lab.sh proxy · taquilla · kiosko · calle · lb1 · lb2 · venta1 · venta2 · venta3 · datos · nuevo · nube entrar

${N}Bloque A · Proxy y balanceo${X} (editas ${N}squid/${X} y ${N}haproxy/${X})
  ./lab.sh squid           comprueba squid/squid.conf y lo aplica
  ./lab.sh registro [n]    las últimas peticiones que ha visto el proxy
  ./lab.sh trafico         una mañana en la taquilla (el personal navega)
  ./lab.sh informe         el informe gráfico de GoAccess → informe/squid.html (ábrelo en tu navegador)
  ./lab.sh haproxy         comprueba haproxy/haproxy.cfg y lo aplica en lb1 y lb2
  ./lab.sh tumbar ventaN   apaga la web de un nodo (y  ./lab.sh levantar ventaN  la enciende)

${N}Bloque B · Alta disponibilidad${X} (editas ${N}keepalived/lb1.conf${X} y ${N}lb2.conf${X})
  ./lab.sh keepalived      los comprueba y los aplica
  ./lab.sh vrrp [n]        lo que cuentan los dos Keepalived
  ./lab.sh caer lbN        apaga de golpe un balanceador (como si se fuera la luz) · ./lab.sh levantar lbN
  ./lab.sh failover        cronometra cuánto tiempo está la tienda sin servicio si se cae lb1

${N}Bloque C · Copias y continuidad${X} (editas ${N}backup/${X}, ${N}nube/opciones${X} y ${N}plan/${X})
  ./lab.sh copia           lanza backup/copia.sh en la máquina datos (como lo haría cron)
  ./lab.sh copias          las copias que hay en el disco externo y en la nube
  ./lab.sh nube            aplica nube/opciones al servicio de fuera de la sede
  ./lab.sh programar       instala backup/crontab en la máquina datos
  ./lab.sh desastre        ⚠️ el simulacro: un ransomware ataca la máquina datos (una vez por arranque)
  ./lab.sh plan            revisa el formato de plan/registro.yaml y plan/riesgos.yaml

${N}Comprobar y entregar${X}
  ./lab.sh comprobar [a|b|c]  qué está bien y qué falta (sin letra, los tres bloques y la calidad)
  ./lab.sh entregar           guarda el informe y te dice cómo subirlo a tu repositorio

  Avance de A y B: ${AVANCE_AB} · Entrega: ${ENTREGA} · Defensa: ${DEFENSA}
EOF
    [ -d solucion ] && echo -e "\n${N}Profesor${X}\n  ./lab.sh solucion a|b|c     carga la solución (guarda antes una copia de lo que hubiera en copias/)\n  ./lab.sh cargar DIR [AAAA-MM-DD]  carga la carpeta del kit de un alumno y la comprueba (con fecha: lo subido ese día a las 23:59)"
}

arrancar() {
    necesita_docker
    # (Solo en la carpeta del profesor, que tiene los scripts sueltos: se vuelven a empaquetar en maquinas.b64)
    [ -f arranque.sh ] && tar -cz arranque.sh trafico.sh nube.sh retencion-base.sh continuidad.py | base64 > maquinas.b64
    info "Arrancando el laboratorio (la primera vez prepara la imagen: unos minutos)…"
    docker compose up -d --build >/dev/null 2>&1 || { error "No se pudo arrancar. Prueba:  docker compose up --build  (y mira el error)"; exit 1; }
    sleep 6
    for m in $MAQUINAS; do corriendo "$m" && bien "$m en marcha" || error "$m no arrancó: docker logs $(c "$m")"; done
    echo; echo "Ahora: ${N}./lab.sh ayuda${X} para ver qué hacer."
}

donde_vip() {
    local m q=""
    for m in lb1 lb2; do corriendo "$m" && en "$m" ip -4 -o addr show dev internet 2>/dev/null | grep -q " $VIP/" && q="$q $m"; done
    echo "${q# }"
}
estado() {
    necesita_docker
    for m in $MAQUINAS; do corriendo "$m" && bien "$m" || aviso "$m parada"; done
    local q; q=$(donde_vip)
    case "$q" in
        "") aviso "Nadie tiene la IP de la tienda ($VIP)" ;;
        *" "*) error "¡Los DOS balanceadores tienen la IP de la tienda! ($q · split-brain)" ;;
        *) info "La IP de la tienda ($VIP) la tiene ${N}$q${X}" ;;
    esac
    hay_desastre && aviso "Ya ha habido un desastre en este arranque: la máquina datos está perdida. Restaura en «nuevo»."
}

# ---------- Bloque A · proxy ----------
SQ="squid -f /etc/squid/lab/squid.conf"
squid_aplicar() {
    necesita_lab
    info "Comprobando squid/squid.conf…"
    local T; T=$(en proxy $SQ -k parse 2>&1); local rc=$?
    if [ $rc -ne 0 ] || echo "$T" | grep -qE "FATAL|ERROR|unrecognized"; then
        error "Hay un error en squid.conf. No he aplicado nada: el proxy sigue como estaba."
        echo "$T" | grep -E -B1 "FATAL|ERROR|unrecognized" | grep -v '^--' | sed 's/^[0-9\/: |]*kid1| //; s/^/    /' | head -6; return 1
    fi
    echo "$T" | grep -q WARNING && { aviso "Avisos (no impiden arrancar, pero léelos):"; echo "$T" | grep WARNING | sed 's/^[0-9\/: |]*kid1| //; s/^/    /' | head -4; }
    if en proxy test -s /run/squid.pid && en proxy sh -c 'kill -0 $(cat /run/squid.pid)' 2>/dev/null; then
        en proxy $SQ -k reconfigure >/dev/null 2>&1
    else
        en proxy $SQ >/dev/null 2>&1
    fi
    sleep 2
    bien "Aplicado. Pruébalo desde la taquilla o el kiosko (curl -x 10.70.0.2:3128 …) y mira  ./lab.sh registro"
}
registro() {
    necesita_lab
    en proxy sh -c "tail -n ${1:-15} /var/log/squid/access.log 2>/dev/null" \
        | awk '{ printf "%s  %-12s %-22s %-4s %s  %s\n", strftime("%H:%M:%S", $1), $3, $4, $6, $7, ($8 == "-" ? "" : "(" $8 ")") }' \
        | grep . || aviso "El proxy no ha visto nada todavía"
}
trafico() { necesita_lab; info "Una mañana en la taquilla…"; en taquilla trafico.sh && bien "Hecho. Ahora:  ./lab.sh informe"; }
informe() {
    necesita_lab
    # El registro de Squid, campo a campo: fecha.ms duración IP estado/código bytes método URL usuario jerarquía tipo
    en proxy sh -c 'goaccess /var/log/squid/access.log --no-global-config --date-format=%s --time-format=%s \
        --log-format="%x.%^ %~%L %h %^/%s %b %m %U %e %^ %M" -o /lab/squid.html >/dev/null 2>&1 \
        && cp /var/log/squid/access.log /var/log/squid/.informe.log' \
        && bien "Informe en ${N}informe/squid.html${X}: ábrelo con tu navegador" || error "GoAccess no ha podido hacer el informe (¿hay peticiones en el registro?)"
}

# ---------- Bloque A · balanceador ----------
haproxy_aplicar() {
    necesita_lab
    info "Comprobando haproxy/haproxy.cfg…"
    local T; if ! T=$(en lb1 haproxy -c -f /etc/haproxy/lab/haproxy.cfg 2>&1); then
        error "Hay un error en haproxy.cfg. No he aplicado nada:"; echo "$T" | grep -E "ALERT|error" | sed 's/^/    /' | head -6; return 1
    fi
    echo "$T" | grep -q WARNING && { aviso "Avisos (no impiden arrancar, pero léelos):"; echo "$T" | grep WARNING | sed 's/^/    /' | head -4; }
    local m; for m in lb1 lb2; do
        corriendo "$m" && en "$m" sh -c 'p=$(cat /run/haproxy.pid 2>/dev/null); haproxy -D -p /run/haproxy.pid -f /etc/haproxy/lab/haproxy.cfg ${p:+-sf $p}'
    done
    bien "Aplicado en lb1 y lb2. Pruébalo desde la calle:  ./lab.sh calle   y   curl -sI http://198.18.70.11/"
}
web_nodo() {   # tumbar|levantar ventaN
    necesita_lab
    case "$2" in venta1|venta2|venta3) ;; *) error "Uso: ./lab.sh $1 venta1|venta2|venta3"; exit 1 ;; esac
    if [ "$1" = tumbar ]; then en "$2" nginx -s stop 2>/dev/null; bien "$2: su web está apagada"
    else en "$2" sh -c '[ -s /run/nginx.pid ] || nginx'; bien "$2: su web está encendida"; fi
}

# ---------- Bloque B · alta disponibilidad ----------
keepalived_aplicar() {
    necesita_lab
    local m T
    for m in lb1 lb2; do
        info "Comprobando keepalived/$m.conf…"
        if ! T=$(en "$m" keepalived -t -f "/etc/keepalived/lab/$m.conf" 2>&1); then
            error "Hay un error en $m.conf. No he aplicado nada:"; echo "$T" | grep -vE '^$' | sed 's/^/    /' | head -6; return 1
        fi
    done
    for m in lb1 lb2; do
        en "$m" sh -c 'p=$(cat /run/keepalived.pid 2>/dev/null); [ -n "$p" ] && kill "$p" 2>/dev/null; for i in 1 2 3 4 5 6 7 8 9 10; do pgrep -x keepalived >/dev/null || break; sleep 0.5; done
                       keepalived -f /etc/keepalived/lab/'"$m"'.conf -G --log-file=/var/log/keepalived.log --flush-log-file -p /run/keepalived.pid'
    done
    sleep 5
    bien "Aplicado."; estado | grep "IP de la tienda"
}
vrrp() {
    necesita_docker
    local m; for m in lb1 lb2; do
        echo "${N}$m${X}"
        if corriendo "$m"; then en "$m" sh -c "tail -n ${1:-8} /var/log/keepalived_vrrp.log 2>/dev/null" | sed 's/^/  /' | grep . || echo "  (nada todavía)"
        else echo "  (apagado)"; fi
    done
}
caer() {
    necesita_docker
    case "${1:-}" in lb1|lb2) ;; *) error "Uso: ./lab.sh caer lb1|lb2"; exit 1 ;; esac
    docker kill "$(c "$1")" >/dev/null 2>&1 && bien "$1 apagado de golpe. Mira quién tiene ahora la IP:  ./lab.sh estado"
}
levantar() {
    necesita_docker
    case "${1:-}" in
        lb1|lb2) docker start "$(c "$1")" >/dev/null 2>&1 && sleep 8 && bien "$1 encendido de nuevo" && estado | grep "IP de la tienda" ;;
        venta1|venta2|venta3) web_nodo levantar "$1" ;;
        *) error "Uso: ./lab.sh levantar lb1|lb2|venta1|venta2|venta3"; exit 1 ;;
    esac
}
# Cuánto tiempo deja de contestar la tienda cuando se cae lb1: la calle pregunta 5 veces por segundo
medir_failover() {
    en calle sh -c 'rm -f /tmp/medida; end=$(( $(date +%s) + 30 )); while [ $(date +%s) -lt $end ]; do
        t=$(date +%s.%N); if curl -s -o /dev/null --connect-timeout 0.3 --max-time 0.5 http://'"$VIP"'/; then echo "$t ok"; else echo "$t mal"; fi >> /tmp/medida; sleep 0.2; done' &
    local bucle=$!
    sleep 4; docker kill "$(c lb1)" >/dev/null 2>&1
    wait "$bucle"
    docker start "$(c lb1)" >/dev/null 2>&1
    en calle awk '$2=="mal" && !a {a=$1} a && $2=="ok" {printf "%.1f\n", $1-a; exit}' /tmp/medida
}
failover() {
    necesita_lab
    [ "$(donde_vip)" = lb1 ] || { error "Para cronometrar, la IP de la tienda tiene que estar en lb1 (y solo en lb1): ./lab.sh estado"; exit 1; }
    info "Tiro lb1 y cronometro (30 s)…"
    local s; s=$(medir_failover)
    sleep 6
    if [ -z "$s" ]; then error "La tienda no ha vuelto en 30 s: ¿lb2 coge la IP? (./lab.sh estado)"; s="más de 30"
    else bien "La tienda ha estado ${N}$s s${X} sin servicio"; fi
    echo "$(date '+%d/%m %H:%M')  sin servicio: $s s" >> informe/failover.txt
    info "Apuntado en informe/failover.txt. lb1 ya está otra vez encendido."
}

# ---------- Bloque C · copias ----------
copias() {
    necesita_lab
    echo "${N}Disco externo${X} (/mnt/usb/taquilla)"
    en datos bash -c 'RESTIC_PASSWORD_FILE=/lab/clave restic -r /mnt/usb/taquilla snapshots 2>&1 | tail -n 12' | sed 's/^/  /'
    echo "${N}Nube${X} ($NUBE_URL)" | sed 's/Nube-Taquilla-27/********/'
    en datos bash -c "RESTIC_PASSWORD_FILE=/lab/clave restic -r $NUBE_URL snapshots 2>&1 | tail -n 12" | sed 's/^/  /'
}
copia() {
    necesita_lab
    [ -s backup/clave ] || { error "backup/clave está vacío: sin contraseña no hay copia (✍️ C1)."; exit 1; }
    info "Lanzando backup/copia.sh en la máquina datos…"
    en datos /lab/copia.sh; local r=$?
    [ $r -eq 0 ] && bien "Copia terminada." || error "La copia ha fallado (código $r). Lee el mensaje de arriba."
    return $r
}
nube() {
    necesita_lab
    info "Aplicando nube/opciones…"
    if en nube nube.sh; then bien "El servicio de la nube está en marcha:"; en nube tail -n 4 /var/log/rest-server.log | sed 's/^/    /'
    else error "No arranca con esas opciones:"; en nube tail -n 5 /var/log/rest-server.log | sed 's/^/    /'; return 1; fi
}
programar() {
    necesita_lab
    info "Instalando backup/crontab en la máquina datos…"
    local T; if T=$(en datos crontab /lab/crontab 2>&1); then bien "Programado. Lo que tiene cron:"; en datos crontab -l | grep -v '^#' | sed 's/^/    /'
    else error "crontab no lo acepta:"; echo "$T" | sed 's/^/    /'; return 1; fi
}

# ---------- comprobar ----------
CU='c(){ curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$@"; }; P="-x 10.70.0.2:3128"; M="-U marta:Taquilla-Marta-26";'
esperar_vip() {   # esperar_vip lbN segundos: ¿la tiene SOLO ese en ese tiempo?
    local i; for i in $(seq $(( $2 * 2 ))); do [ "$(donde_vip)" = "$1" ] && return 0; sleep 0.5; done; return 1
}
# Cuántos servidores tiene el balanceador de lb1 en sus backends (se lo pregunta a HAProxy por su socket)
servidores() {
    docker exec "$(c lb1)" sh -c "echo 'show stat' | socat stdio /run/haproxy.sock" 2>/dev/null \
        | awk -F, '$1 !~ /^#/ && NF > 2 && $2 != "FRONTEND" && $2 != "BACKEND" {print $1 "/" $2}' | sort -u | wc -l
}
export VIP; export -f c en corriendo donde_vip esperar_vip servidores
# Lo que hay detrás de los dos puntos en la línea de un fichero que contiene ese texto (sin espacios, comillas ni %)
dato() { echo "sed -n 's/^- ✍️ $1[^:]*:[[:space:]]*//p' $2 | head -1 | tr -d ' \\r\\140%'"; }
num() { grep -m1 -F -- "$1" "$2" 2>/dev/null | sed 's/^[^:]*://' | tr ',' '.' | grep -oE '[0-9]+(\.[0-9]+)?' | head -n1; }
# Corrigiendo una entrega (./lab.sh cargar): lo que solo se ve en la máquina del alumno se toma de su entrega/informe.txt
de_entrega() {   # de_entrega PATRÓN N: las líneas de su informe que empiezan por ese apartado
    local l n=0 b=${1:0:1}
    while IFS= read -r l; do
        n=$((n + 1))
        case "$l" in "✔ "*) cuenta "$b" 1; bien "${l#✔ } (según su entrega/informe.txt)" ;; *) cuenta "$b" 0; echo "${R}✘${X} ${l#✘ } (según su entrega/informe.txt)" ;; esac
    done < <(grep -E "^(✔|✘) $1" "$CARGADO/entrega/informe.txt" 2>/dev/null)
    [ "$n" -gt 0 ] || { local i; for i in $(seq "$2"); do cuenta "$b" 0; done; echo "${R}✘${X} $1 · Sin entrega/informe.txt: no se puede comprobar ($2 pruebas)"; }
}

comprobar_a() {
    echo "${N}Bloque A · El proxy de la oficina (desde la taquilla y el kiosko)${X}"
    prueba "👀 La caché: la segunda vez que se pide una página, la da el proxy (Cache-Status: …;hit)" taquilla \
        "curl -s -o /dev/null -x 10.70.0.2:3128 -U marta:Taquilla-Marta-26 http://cartelera.test/concierto-3.html; curl -sI -x 10.70.0.2:3128 -U marta:Taquilla-Marta-26 http://cartelera.test/concierto-3.html | grep -qi '^Cache-Status:.*;hit'"
    prueba "A1 · reventa.test (también www.) y apuestas.test, prohibidos (403); proveedor.test, no" taquilla \
        "$CU [ \$(c \$P \$M http://reventa.test/) = 403 ] && [ \$(c \$P \$M http://www.reventa.test/) = 403 ] && [ \$(c \$P \$M http://apuestas.test/) = 403 ] && [ \$(c \$P \$M http://proveedor.test/) = 200 ]" \
        "una ACL con los dos sitios (¿y sus subdominios?) y un deny con ella, ANTES de cualquier allow"
    prueba "A2 · Ni .mp4, ni .mkv, ni .avi (403), pero el catálogo en PDF sí" taquilla \
        "$CU [ \$(c \$P \$M http://proveedor.test/promo.mp4) = 403 ] && [ \$(c \$P \$M http://proveedor.test/backstage.mkv) = 403 ] && [ \$(c \$P \$M http://proveedor.test/entrevista.avi) = 403 ] && [ \$(c \$P \$M http://proveedor.test/catalogo.pdf) = 200 ]" \
        "una ACL que mire cómo ACABA la ruta de la URL (sin distinguir mayúsculas) y su deny"
    local r3=1
    prueba "A3 · El personal, sin usuario, no sale (407)…" taquilla "$CU [ \$(c \$P http://proveedor.test/) = 407 ]" \
        "auth_param basic … y una ACL proxy_auth con su allow; y quita el allow provisional" && r3=0
    prueba "A3 · …con marta y con jon, sí; con una contraseña mala, no" taquilla \
        "[ $r3 = 0 ] && $CU [ \$(c \$P \$M http://proveedor.test/) = 200 ] && [ \$(c \$P -U jon:Taquilla-Jon-26 http://proveedor.test/) = 200 ] && [ \$(c \$P -U marta:mala http://proveedor.test/) = 407 ]" \
        "./lab.sh proxy  y  htpasswd sobre /etc/squid/lab/usuarios (ojo con -c: crea el fichero de nuevo)"
    prueba "A4 · El kiosko ve la cartelera sin usuario… pero no proveedor.test" kiosko "$CU [ \$(c \$P http://cartelera.test/) = 200 ] && [ \$(c \$P http://proveedor.test/) != 200 ]" \
        "una ACL con el destino permitido y un allow que junte el kiosko y ese destino en la misma línea (las dos a la vez)"
    prueba "A4 · …y lo que no es la cartelera, prohibido (403, sin pedirle usuario)" kiosko \
        "$CU [ \$(c \$P http://proveedor.test/) = 403 ] && [ \$(c \$P http://reventa.test/) = 403 ]" \
        "después de su allow, un deny para el kiosko, y todo ANTES de la regla del personal (si no, le pide usuario: 407)"
    echo; echo "${N}Bloque A · A5 · El informe gráfico (GoAccess)${X}"
    if [ -n "${CARGADO:-}" ]; then de_entrega "A5" 3
    else
        prueba "A5 · informe/squid.html, hecho con GoAccess" proxy "grep -q GoAccess /lab/squid.html" "./lab.sh trafico  y  ./lab.sh informe"
        local top='awk "{print \$7}" /var/log/squid/.informe.log | sort | uniq -c | sort -rn | awk "NR==1{print \$2}"'
        prueba "A5 · La URL más pedida" proxy \
            "v=\$($(dato 'A5 · La URL' /lab/datos.md)); t=\$($top); [ -n \"\$v\" ] && { [ \"\$v\" = \"\$t\" ] || [ \"http://\$v\" = \"\$t\" ]; }" \
            "el panel «Requested Files» del informe, la primera fila. ¿Has hecho peticiones después? Vuelve a hacer el informe"
        local quien='awk "\$8 != \"-\" {print \$8}" /var/log/squid/.informe.log | sort | uniq -c | sort -rn | awk "NR==1{print \$2}"'
        prueba "A5 · El usuario del personal que más peticiones ha hecho" proxy \
            "v=\$($(dato 'A5 · El usuario' /lab/datos.md)); t=\$($quien); [ -n \"\$v\" ] && [ \"\$v\" = \"\$t\" ]" \
            "el panel de los usuarios (autenticación HTTP) del informe"
    fi

    echo; echo "${N}Bloque A · El balanceador (desde la calle, contra lb1)${X}"
    prueba "👀 La tienda contesta a través de lb1" calle "curl -sf -o /dev/null --max-time 5 http://198.18.70.11/"
    local nodo; nodo=$(en calle sh -c "curl -sI --max-time 3 http://198.18.70.11/ | tr -d '\r' | sed -n 's/^[Xx]-[Nn]odo: //p'" 2>/dev/null)
    prueba "A6 · La cesta: el mismo cliente, SIEMPRE al mismo nodo (10 peticiones), con los tres nodos en el reparto" host \
        "[ \$(servidores) -ge 3 ] && [ \$(for i in 1 2 3 4 5 6 7 8 9 10; do docker exec $(c calle) curl -sI --max-time 3 http://198.18.70.11/ | grep -i '^x-nodo'; done | sort -u | wc -l) -eq 1 ]" \
        "el algoritmo de reparto que elige el nodo según la IP de quien llega, y los tres nodos (10.70.1.21, .22 y .23). Luego  ./lab.sh haproxy"
    # Si su nodo cae, sigue comprando en otro; si cae también ese, en el tercero: los tres nodos y sus comprobaciones
    local r6=1
    if [ -n "$nodo" ]; then
        docker exec "$(c "$nodo")" nginx -s stop 2>/dev/null; sleep 4
        local otro; otro=$(en calle sh -c "curl -sI --max-time 3 http://198.18.70.11/ | tr -d '\r' | sed -n 's/^[Xx]-[Nn]odo: //p'" 2>/dev/null)
        if [ -n "$otro" ] && [ "$otro" != "$nodo" ]; then docker exec "$(c "$otro")" nginx -s stop 2>/dev/null; sleep 4; fi
        prueba "A6 · Si su nodo se cae, sigue comprando en otro… y si se cae también ese, en el tercero" calle \
            "[ -n '$otro' ] && [ '$otro' != '$nodo' ] && h=\$(curl -sI --max-time 3 http://198.18.70.11/) && echo \"\$h\" | head -1 | grep -q ' 200' && ! echo \"\$h\" | grep -qiE 'x-nodo: ($nodo|$otro)'" \
            "los TRES nodos en el backend, y que HAProxy pregunte a cada uno por /estado cada segundo (option httpchk y check)" && r6=0
        for m in venta1 venta2 venta3; do docker exec "$(c "$m")" sh -c '[ -s /run/nginx.pid ] || nginx' 2>/dev/null; done
        sleep 3
    else
        prueba "A6 · Si su nodo se cae, sigue comprando en otro… y si se cae también ese, en el tercero" calle "false" "la tienda no contesta a través de lb1"
    fi
    prueba "A7 · Estadísticas en :8404/estadisticas, solo con usuario (en lb1 y en lb2)" calle \
        "c(){ curl -s -o /dev/null -w '%{http_code}' --max-time 5 \"\$@\"; }; [ \$(c http://198.18.70.11:8404/estadisticas) = 401 ] && [ \$(c -u admin:Taquilla-Stats http://198.18.70.11:8404/estadisticas) = 200 ] && [ \$(c -u admin:Taquilla-Stats http://198.18.70.12:8404/estadisticas) = 200 ]" \
        "un frontend nuevo en el 8404 con las opciones stats (enable, uri y auth)"
    local m2="x$RANDOM$RANDOM"
    prueba "A8 · Los nodos ven la IP real de quien compra (X-Forwarded-For)" host \
        "for i in 1 2 3; do docker exec $(c calle) curl -s -o /dev/null http://198.18.70.11/?$m2; done; sleep 1; for w in venta1 venta2 venta3; do docker exec sad-p5-\$w grep '$m2' /var/log/nginx/access.log; done | grep -q 'xff=198.18.70.80 '" \
        "una opción del frontend que añade la cabecera (mira  ./lab.sh venta1  y  tail /var/log/nginx/access.log)"
}

comprobar_b() {
    echo "${N}Bloque B · Alta disponibilidad (tarda un minuto: tira y levanta balanceadores)${X}"
    prueba "👀 Al empezar, la IP de la tienda la tiene SOLO lb1" host "esperar_vip lb1 12" "./lab.sh keepalived  y  ./lab.sh estado"
    local r1=1 r2=1
    prueba "B1 · Se cae lb1 y lb2 coge la IP (y la tienda sigue vendiendo)" host \
        "docker kill $(c lb1) >/dev/null && esperar_vip lb2 20 && docker exec $(c calle) curl -sf -o /dev/null --max-time 3 http://$VIP/" \
        "lb2.conf: ¿qué cambia en el de reserva? Su estado, su prioridad (más baja), quién es él y quién el otro. Lo demás, idéntico" \
        && r1=0
    docker start "$(c lb1)" >/dev/null 2>&1
    prueba "B1 · Vuelve lb1 y recupera la IP (lb2 la suelta: nunca los dos)" host "[ $r1 = 0 ] && esperar_vip lb1 20" \
        "lb1 tiene más prioridad: al volver la recupera. Si la tienen los dos, no se oyen: ¿unicast_peer?"
    prueba "B2 · Si HAProxy se para en lb1 (el servidor sigue encendido), la IP se va a lb2" host \
        "esperar_vip lb1 12 && docker exec $(c lb1) killall haproxy && esperar_vip lb2 12" \
        "un vrrp_script que compruebe HAProxy y reste prioridad, y track_script en el vrrp_instance. ¿Cuánto hay que restar a 200 para quedar por debajo de lb2?" \
        && r2=0
    docker exec "$(c lb1)" sh -c '[ -n "$(pidof haproxy)" ] || haproxy -D -p /run/haproxy.pid -f /etc/haproxy/lab/haproxy.cfg' 2>/dev/null
    prueba "B2 · …y cuando HAProxy vuelve, la IP vuelve a lb1" host "[ $r2 = 0 ] && esperar_vip lb1 12" "rise: unas comprobaciones buenas y suma otra vez"
    local s=""; esperar_vip lb1 15 >/dev/null && s=$(medir_failover); sleep 6
    [ -n "$s" ] && echo "$(date '+%d/%m %H:%M')  sin servicio: $s s  (comprobar)" >> informe/failover.txt
    prueba "B3 · Si se cae lb1, la tienda está menos de 5 s sin servicio (${s:-?} s)" host \
        "[ -n '$s' ] && awk 'BEGIN{exit !(\"$s\"+0 < 5)}'" \
        "lb2 da por muerto a lb1 tras 3 avisos perdidos: ¿cada cuánto avisan? (en los dos ficheros)"
    esperar_vip lb1 15 >/dev/null
    local f=plan/plan-continuidad.md seg ult min nue
    seg=$(num "B4 · Segundos sin servicio" $f); min=$(num "B4 · Minutos al año" $f); nue=$(num "B4 · Nueves" $f)
    ult=$(grep -v '(comprobar)' informe/failover.txt 2>/dev/null | tail -1 | grep -oE '[0-9]+(\.[0-9]+)? s' | grep -oE '[0-9.]+')
    prueba "B4 · plan-continuidad.md: el tiempo de tu último ./lab.sh failover" host \
        "[ -n '$seg' ] && [ -n '$ult' ] && awk 'BEGIN{d=$seg-$ult; exit !(d<=0.2 && d>=-0.2)}'" \
        "lanza  ./lab.sh failover  y copia el último tiempo de informe/failover.txt"
    prueba "B4 · plan-continuidad.md: los minutos de un 99,9 % y los nueves de 5 minutos al año" host \
        "[ -n '$min' ] && awk 'BEGIN{d=$min-525.6; exit !(d<=1 && d>=-1)}' && [ '$nue' = 5 ]" \
        "un año tiene 525 600 minutos: ¿cuánto es el 0,1 %? (UD10, apartado 1: los «nueves»)"
}

comprobar_c_antes() {
    echo "${N}Bloque C · Las copias (en la máquina datos y en la nube)${X}"
    prueba "👀 La nube pide usuario y contraseña (sin ellos, 401)" datos \
        "[ \$(curl -s -o /dev/null -w '%{http_code}' http://198.18.70.50:8000/taquilla/config) = 401 ]"
    prueba "C1 · El repositorio del disco externo existe, se abre con backup/clave y la clave es larga (12 o más)" datos \
        "[ -s /lab/clave ] && [ \$(head -n1 /lab/clave | tr -d '\n' | wc -c) -ge 12 ] && RESTIC_PASSWORD_FILE=/lab/clave restic -r /mnt/usb/taquilla cat config" \
        "escribe una contraseña larga en backup/clave y crea el repositorio en la máquina datos: restic -r … init"
    local L="RESTIC_PASSWORD_FILE=/lab/clave restic --no-lock -r /mnt/usb/taquilla"
    prueba "C2 · La última copia del disco externo tiene los compradores" datos \
        "$L ls latest | grep -q '/srv/taquilla/compradores/compradores.csv'" "./lab.sh copia  y mira el mensaje"
    prueba "C2 · …sin las sesiones de tmp/ ni las entradas a medio subir (.part)" datos \
        "$L ls latest | grep -q compradores.csv && ! $L ls latest | grep -qE '/tmp(/|\$)|\.part\$'" \
        "excluir.txt: un patrón por línea, y en copia.sh la opción que lee ese fichero"
    prueba "C2 · …y con la etiqueta «nocturna»" datos "[ \$($L snapshots --tag nocturna --json | jq length) -gt 0 ]" \
        "la opción de restic backup que pone una etiqueta"
    prueba "C3 · La retención: con 120 días de copias deja las que pide La Taquilla (14 diarias, 8 semanales, 6 mensuales)" datos "
        linea=\$(grep -E '^[^#]*restic .*forget' /lab/copia.sh | head -n1); [ -n \"\$linea\" ] || exit 1
        opts=\$(echo \"\$linea\" | grep -oE -- '--keep-[a-z-]+([ =]+[0-9a-z]+)?' | tr '\n' ' ')
        rm -rf /tmp/ret && cp -a /var/lib/lab/ret-base /tmp/ret
        RESTIC_PASSWORD=prueba-retencion restic -r /tmp/ret forget \$opts -q >/dev/null || exit 1
        [ \$(RESTIC_PASSWORD=prueba-retencion restic -r /tmp/ret snapshots --json | jq length) = $RETENCION_ESPERADA ]" \
        "restic forget con una opción --keep-… por cada tipo de copia"
    prueba "C3 · …y libera el espacio de lo que olvida" datos \
        "grep -qE '^[^#]*restic .*forget.*--prune' /lab/copia.sh || grep -qE '^[^#]*restic .* prune' /lab/copia.sh" \
        "forget solo borra la lista: ¿qué hace falta para que se borren los datos?"
    local NU="RESTIC_PASSWORD_FILE=/lab/clave restic --no-lock -r $NUBE_URL"
    prueba "C4 · Fuera de la sede: la nube tiene una copia con los compradores y sin tmp/" datos \
        "$NU ls latest | grep -q compradores/compradores.csv && ! $NU ls latest | grep -qE '/tmp(/|\$)'" \
        "crea también el repositorio de la nube (init) y añade a copia.sh la copia allí"
    prueba "C5 · La nube no deja BORRAR (ni con la contraseña): solo añadir" datos \
        "[ \$(curl -s -o /dev/null -w '%{http_code}' -X DELETE $NUBE_HTTP/keys/$(printf '0%.0s' {1..64})) = 403 ]" \
        "nube/opciones: la opción de rest-server que impide borrar (y ./lab.sh nube)"
    prueba "C6 · cron lanza la copia cada 6 horas, a y cuarto" datos \
        "crontab -l 2>/dev/null | grep -qE '^15[[:space:]]+(\*/6|0,6,12,18)[[:space:]]+\*[[:space:]]+\*[[:space:]]+\*[[:space:]]+.*/lab/copia\.sh'" \
        "backup/crontab: minuto, hora (cada 6), día, mes, día de la semana y la orden (/lab/copia.sh). Después ./lab.sh programar"
}

desastre() {
    necesita_lab
    hay_desastre && { error "Ya ha habido un desastre en este arranque. Para repetirlo:  ./lab.sh reiniciar"; exit 1; }
    echo "${R}${N}SIMULACRO · Un ransomware entra en la máquina de datos de La Taquilla.${X}"
    echo "Va a cifrar los datos, borrar el disco externo e intentar borrar las copias de la nube con la contraseña"
    echo "que encuentre. Después, la máquina datos se da por perdida y restauras en ${N}nuevo${X}."
    read -r -p "¿Seguimos? (escribe si) " r; [ "$r" = si ] || { echo "Cancelado."; exit 0; }
    info "Guardando cómo estaba todo antes del ataque…"
    OK_C=0; TOT_C=0; comprobar_c_antes > /tmp/c-antes.$$ 2>&1; echo "RESULTADO $OK_C $TOT_C" >> /tmp/c-antes.$$
    docker cp /tmp/c-antes.$$ "$(c nube)":/etc/lab/antes.txt >/dev/null; rm -f /tmp/c-antes.$$
    en datos bash -c 'cd /srv/taquilla && find . -type f ! -path "./tmp/*" ! -name "*.part" -exec sha256sum {} + | sort -k2' \
        | docker exec -i "$(c nube)" sh -c 'cat > /etc/lab/verdad'
    sleep 1
    echo; info "03:12 · El ransomware cifra /srv/taquilla…"
    en datos bash -c 'find /srv/taquilla -type f | while read -r f; do head -c 4096 /dev/urandom > "$f.cifrado"; rm -f "$f"; done
        printf "Tus ficheros están cifrados. Paga 3 BTC a … para recuperarlos.\n" > /srv/taquilla/LEEME-RESCATE.txt'
    en datos bash -c 'ls /srv/taquilla/compradores | head -3' | sed 's/^/    /'
    info "03:13 · …borra el disco externo (lo tiene conectado)…"
    en datos bash -c 'rm -rf /mnt/usb/* /mnt/usb/.[!.]* 2>/dev/null; ls -A /mnt/usb | wc -l' | sed 's/^/    ficheros en \/mnt\/usb: /'
    info "03:14 · …y encuentra en /lab/copia.sh la dirección de la nube y su contraseña. Intenta borrar todas las copias:"
    en datos bash -c "export RESTIC_PASSWORD_FILE=/lab/clave; ids=\$(restic -r $NUBE_URL snapshots --json 2>/dev/null | jq -r '.[].id'); \
        restic -r $NUBE_URL unlock --remove-all >/dev/null 2>&1; \
        [ -n \"\$ids\" ] && restic -r $NUBE_URL forget \$ids --prune 2>&1 | grep -vE '^\\[' | tail -n 2 || echo 'no hay copias en la nube'" | sed 's/^/    /'
    echo
    local quedan; quedan=$(en datos bash -c "RESTIC_PASSWORD_FILE=/lab/clave restic -r $NUBE_URL snapshots --json 2>/dev/null | jq length" 2>/dev/null)
    if [ "${quedan:-0}" -gt 0 ] 2>/dev/null; then
        bien "En la nube quedan copias a salvo (${quedan}). La máquina datos está perdida: ${N}restaura en «nuevo»${X} (./lab.sh nuevo) y cronometra."
    else
        error "En la nube no queda ninguna copia. La Taquilla ha perdido sus datos."
        echo "    Arregla lo que falte (¿la nube deja borrar?) y repite desde cero:  ./lab.sh reiniciar"
    fi
}

comprobar_c() {
    if hay_desastre; then
        local antes; antes=$(en nube cat /etc/lab/antes.txt)
        echo "$antes" | grep -v '^RESULTADO'
        set -- $(echo "$antes" | grep '^RESULTADO'); OK_C=$((OK_C + ${2:-0})); TOT_C=$((TOT_C + ${3:-0}))
        echo "    (comprobado justo antes de ./lab.sh desastre)"
    else
        comprobar_c_antes
    fi
    echo; echo "${N}Bloque C · El simulacro (en «nuevo») y el plan de continuidad${X}"
    if [ -n "${CARGADO:-}" ]; then de_entrega "C7 · Los datos" 1
    elif hay_desastre; then
        prueba "C7 · Los datos de La Taquilla, restaurados en «nuevo» en /srv/taquilla, idénticos a los de antes del ataque" host \
            "diff <(docker exec $(c nube) cat /etc/lab/verdad) <(docker exec $(c nuevo) bash -c 'cd /srv/taquilla 2>/dev/null && find . -type f ! -path \"./tmp/*\" ! -name \"*.part\" -exec sha256sum {} + | sort -k2')" \
            "en nuevo: restic -r <la nube> restore latest --target /  (la contraseña está en /lab/clave)"
    else
        echo "${R}✘${X} C7 · Los datos de La Taquilla, restaurados en «nuevo»"; echo "    ${A}💡${X} todavía no ha habido desastre: cuando C1–C6 estén bien,  ./lab.sh desastre"; cuenta C 0
    fi
    local f=plan/plan-continuidad.md rto rpo
    rto=$(num "C7 · RTO" $f); rpo=$(num "C7 · RPO" $f)
    prueba "C7 · plan-continuidad.md: el RTO medido en el simulacro" host "[ -n '$rto' ] && awk 'BEGIN{exit !($rto > 0 && $rto <= 900)}'" \
        "lo que tardó la restauración en «nuevo», en segundos: ponle  time  delante de la orden"
    prueba "C7 · plan-continuidad.md: el RPO que da tu crontab" host "[ '$rpo' = 6 ]" \
        "si la copia se hace cada 6 horas, ¿cuánto se puede perder como mucho?"
    echo; echo "${N}Bloque C · El registro de tratamiento y los riesgos (plan/)${X}"
    local salida; salida=$(docker exec "$(c datos)" python3 /usr/local/bin/continuidad.py comprobar | tr -d '\r')
    echo "$salida" | grep -v '^RESULTADO'
    set -- $(echo "$salida" | grep '^RESULTADO'); OK_C=$((OK_C + ${2:-0})); TOT_C=$((TOT_C + ${2:-0} + ${3:-0}))
}

# Calidad (1 punto por bloque = 0,5 + 0,5): lo que se puede medir sin opinar
calidad() {
    echo "${N}Calidad${X}"
    CAL_A1=0; CAL_A2=0; CAL_B1=0; CAL_B2=0; CAL_C1=0; CAL_C2=0
    local T H
    local rh; T=$(en proxy $SQ -k parse 2>&1); H=$(en lb1 haproxy -c -f /etc/haproxy/lab/haproxy.cfg 2>&1); rh=$?
    if [ "${OK_A:-0}" -gt 0 ] && ! echo "$T" | grep -qE "FATAL|ERROR|WARNING|unrecognized" && [ $rh = 0 ] && ! echo "$H" | grep -q WARNING; then
        bien "A · squid.conf y haproxy.cfg (ya trabajados) cargan sin errores ni avisos"; CAL_A1=1
    else echo "${R}✘${X} A · squid.conf o haproxy.cfg dan errores o avisos (./lab.sh squid · ./lab.sh haproxy)"; fi
    if ! grep -qE '^[[:space:]]*http_access allow oficina' squid/squid.conf && [ "$(grep -cE '^(marta|jon):\$(apr1|2y)\$' squid/usuarios 2>/dev/null)" = 2 ]; then
        bien "A · Sin la regla provisional y con los dos usuarios del personal, con la contraseña cifrada"; CAL_A2=1
    else echo "${R}✘${X} A · Queda la regla provisional, o squid/usuarios no tiene a marta y a jon (cada uno una vez, cifrados)"; fi
    if en lb1 keepalived -t -f /etc/keepalived/lab/lb1.conf >/dev/null 2>&1 && en lb2 keepalived -t -f /etc/keepalived/lab/lb2.conf >/dev/null 2>&1 \
        && [ "$(grep -hE 'virtual_router_id|auth_pass|198\.18\.70\.100/24' keepalived/lb1.conf | tr -s ' ' | sort)" = "$(grep -hE 'virtual_router_id|auth_pass|198\.18\.70\.100/24' keepalived/lb2.conf | tr -s ' ' | sort)" ]; then
        bien "B · Los dos ficheros de Keepalived cargan y comparten lo que tienen que compartir (grupo, clave e IP)"; CAL_B1=1
    else echo "${R}✘${X} B · Algún fichero de Keepalived no carga, o lb1 y lb2 no tienen el mismo grupo, clave o IP"; fi
    if grep -v '(comprobar)' informe/failover.txt 2>/dev/null | grep -q 'sin servicio'; then
        bien "B · Has cronometrado el failover tú (informe/failover.txt)"; CAL_B2=1
    else echo "${R}✘${X} B · No has lanzado ./lab.sh failover (informe/failover.txt)"; fi
    if en datos python3 /usr/local/bin/continuidad.py formato 2>/dev/null | grep -q '✔.*registro.yaml' \
        && ! grep -qE '^[^#]*RESTIC_PASSWORD=' backup/copia.sh; then
        bien "C · El registro completo (sin huecos) y la contraseña de las copias solo en backup/clave"; CAL_C1=1
    else echo "${R}✘${X} C · Queda algún hueco en plan/registro.yaml, o la contraseña de las copias está escrita en copia.sh"; fi
    if en datos bash -c "RESTIC_PASSWORD_FILE=/lab/clave restic --no-lock -r $NUBE_URL check" >/dev/null 2>&1; then
        bien "C · El repositorio de la nube está sano (restic check)"; CAL_C2=1
    else echo "${R}✘${X} C · El repositorio de la nube no pasa restic check (o no existe)"; fi
}

comprobar() {
    necesita_lab
    OK_A=0; TOT_A=0; OK_B=0; TOT_B=0; OK_C=0; TOT_C=0
    case "${1:-todo}" in
        a|A) comprobar_a ;;
        b|B) comprobar_b ;;
        c|C) comprobar_c ;;
        *) comprobar_a; echo; comprobar_b; echo; comprobar_c; echo; calidad ;;
    esac
    echo
    local b
    for b in A B C; do
        local tot=TOT_$b ok=OK_$b
        [ "${!tot}" -gt 0 ] && echo "${N}Bloque $b:${X} ${!ok} de ${!tot} pruebas  →  funciona $(awk "BEGIN{printf \"%.1f\", 5*${!ok}/${!tot}}") de 5"
    done
    if [ "${1:-todo}" = todo ]; then
        echo "${N}Calidad:${X} A $(awk "BEGIN{printf \"%.1f\", 0.5*$CAL_A1+0.5*$CAL_A2}") de 1 · B $(awk "BEGIN{printf \"%.1f\", 0.5*$CAL_B1+0.5*$CAL_B2}") de 1 · C $(awk "BEGIN{printf \"%.1f\", 0.5*$CAL_C1+0.5*$CAL_C2}") de 1"
        echo "(el avance, 2,5, y Git, 1,5, los pone el profesor al ver tu repositorio)"
    fi
    echo "(los 👀 no cuentan: son los ejemplos resueltos)"
}

entregar() {
    necesita_lab
    mkdir -p entrega
    info "Comprobando tu práctica para guardar el informe en la entrega (tarda un par de minutos)…"
    comprobar | sed 's/\x1b\[[0-9;]*m//g' > entrega/informe.txt
    tail -6 entrega/informe.txt
    bien "Informe guardado en ${N}entrega/informe.txt${X}. Ahora súbelo todo a tu repositorio:"
    echo "    git add -A ."
    echo "    git commit -m \"P5 · entrega\""
    echo "    git push"
    git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
        || aviso "Esta carpeta no está dentro de tu repositorio: muévela dentro (con squid/, haproxy/… tal cual) y repite"
}

# ---------- profesor ----------
guardar_copia() { local f="copias/$(date +%H%M%S)"; mkdir -p "$f"; cp -r squid haproxy keepalived backup nube plan informe respuestas.md "$f"/ 2>/dev/null; aviso "Copia de lo que había en $f/"; }
solucion() {
    [ -d solucion ] || { error "Esta orden es solo del profesor."; exit 1; }
    necesita_lab; guardar_copia
    case "${1:-}" in
        a) cp solucion/a/squid.conf solucion/a/usuarios squid/; cp solucion/a/haproxy.cfg haproxy/; cp solucion/respuestas.md respuestas.md
           squid_aplicar; haproxy_aplicar; trafico; informe
           local top quien
           top=$(en proxy sh -c 'awk "{print \$7}" /var/log/squid/.informe.log | sort | uniq -c | sort -rn | awk "NR==1{print \$2}"')
           quien=$(en proxy sh -c 'awk "\$8 != \"-\" {print \$8}" /var/log/squid/.informe.log | sort | uniq -c | sort -rn | awk "NR==1{print \$2}"')
           sed -i -e "s|^\(- ✍️ A5 · La URL[^:]*:\).*|\1 $top|" -e "s|^\(- ✍️ A5 · El usuario[^:]*:\).*|\1 $quien|" informe/datos.md
           bien "datos.md: $top · $quien" ;;
        b) cp solucion/b/lb1.conf solucion/b/lb2.conf keepalived/; keepalived_aplicar; sleep 3; failover
           local s; s=$(grep -v '(comprobar)' informe/failover.txt | tail -1 | grep -oE '[0-9]+(\.[0-9]+)? s' | grep -oE '[0-9.]+')
           sed -i -e "s|^\(- ✍️ B4 · Segundos[^:]*:\).*|\1 $s|" -e "s|^\(- ✍️ B4 · Minutos[^:]*:\).*|\1 525,6|" -e "s|^\(- ✍️ B4 · Nueves[^:]*:\).*|\1 5|" plan/plan-continuidad.md ;;
        c) cp solucion/c/copia.sh solucion/c/clave solucion/c/excluir.txt solucion/c/crontab backup/; cp solucion/c/opciones nube/
           cp solucion/c/registro.yaml solucion/c/riesgos.yaml plan/
           nube
           en datos bash -c "export RESTIC_PASSWORD_FILE=/lab/clave; restic -r /mnt/usb/taquilla cat config >/dev/null 2>&1 || restic -r /mnt/usb/taquilla init -q
               restic -r $NUBE_URL cat config >/dev/null 2>&1 || restic -r $NUBE_URL init -q"
           copia >/dev/null && bien "Copia hecha"; programar >/dev/null && bien "cron programado"
           sed -i "s|^\(- ✍️ C7 · RPO[^:]*:\).*|\1 6|" plan/plan-continuidad.md
           if ! hay_desastre; then
               yes si | desastre >/dev/null 2>&1; bien "Desastre simulado"
               local t0 t1 rto; t0=$(LC_ALL=C date +%s.%N)
               en nuevo bash -c "RESTIC_PASSWORD_FILE=/lab/clave restic -r $NUBE_URL restore latest --target / -q"
               t1=$(LC_ALL=C date +%s.%N); rto=$(LC_ALL=C awk "BEGIN{printf \"%.1f\", $t1 - $t0}")
               sed -i "s|^\(- ✍️ C7 · RTO[^:]*:\).*|\1 $rto|" plan/plan-continuidad.md; bien "Restaurado en nuevo en $rto s"
           fi ;;
        *) error "Uso: ./lab.sh solucion a|b|c"; exit 1 ;;
    esac
}
cargar() {
    local d=${1:-} fecha=${2:-}
    [ -d "$d/squid" ] && [ -d "$d/backup" ] || { error "Uso: ./lab.sh cargar CARPETA [AAAA-MM-DD]  (la carpeta del kit en el repo del alumno, con squid/ y backup/ dentro)"; exit 1; }
    if [ -n "$fecha" ]; then
        local cm t; cm=$(git -C "$d" rev-list -1 --before="$fecha 23:59:59" HEAD) || { error "No es un repositorio git"; exit 1; }
        [ -n "$cm" ] || { error "No había nada subido el $fecha"; exit 1; }
        t=$(mktemp -d); git -C "$d" archive "$cm" -- . | tar -x -C "$t"
        info "Cargando lo subido hasta el $fecha: $(git -C "$d" log -1 --format='%h · %ad · %s' --date=format:'%d/%m %H:%M' "$cm")"
        d=$t
    fi
    necesita_docker; guardar_copia
    # Desde cero (el disco externo y la nube, vacíos) y con SUS ficheros: se vacía cada carpeta por dentro, sin borrarla
    info "Reiniciando el laboratorio desde cero…"; docker compose down -v -t 1 >/dev/null 2>&1
    local x; for x in squid haproxy keepalived backup nube plan informe; do
        mkdir -p "$x"; find "$x" -mindepth 1 -delete 2>/dev/null
        [ -d "$d/$x" ] && cp -r "$d/$x/." "$x/"
    done
    cp "$d/respuestas.md" respuestas.md 2>/dev/null || aviso "La entrega no trae respuestas.md"
    chmod +x backup/copia.sh 2>/dev/null   # git en Windows (o sacado de un commit) puede perder el permiso de ejecución
    arrancar >/dev/null; sleep 4
    # que la máquina datos haya terminado de crear los datos de la tienda (el último fichero son los .part)
    local i; for i in $(seq 1 60); do en datos test -f /srv/taquilla/entradas/subiendo-3.part 2>/dev/null && break; sleep 2; done
    squid_aplicar >/dev/null 2>&1 || aviso "Su squid.conf no carga"
    haproxy_aplicar >/dev/null 2>&1 || aviso "Su haproxy.cfg no carga"
    keepalived_aplicar >/dev/null 2>&1 || { sleep 5; keepalived_aplicar >/dev/null 2>&1; } || aviso "Su Keepalived no carga"
    nube >/dev/null 2>&1 || aviso "Su nube/opciones no arranca"
    programar >/dev/null 2>&1 || aviso "Su crontab no se instala"
    # Sus copias: con SU clave y SU copia.sh, en un disco externo y una nube nuevos
    if [ -s backup/clave ]; then
        en datos bash -c "export RESTIC_PASSWORD_FILE=/lab/clave; restic -r /mnt/usb/taquilla init -q; restic -r $NUBE_URL init -q" >/dev/null 2>&1
        en datos /lab/copia.sh >/dev/null 2>&1 || aviso "Su copia.sh falla"
    fi
    CARGADO=$d comprobar
}
# ---------- fin profesor ----------

case "${1:-ayuda}" in
    arrancar) arrancar ;;
    parar) necesita_docker; docker compose stop -t 1 >/dev/null 2>&1 && bien "Laboratorio parado" ;;
    reiniciar) necesita_docker; info "Borrando las máquinas, el disco externo y la nube…"; docker compose down -v -t 1 >/dev/null 2>&1; arrancar ;;
    estado) estado ;;
    proxy|taquilla|kiosko|calle|lb1|lb2|venta1|venta2|venta3|datos|nuevo)
        necesita_docker; corriendo "$1" || { error "$1 está apagada"; exit 1; }; docker exec -it "$(c "$1")" bash ;;
    nube) necesita_docker; if [ "${2:-}" = entrar ]; then docker exec -it "$(c nube)" bash; else nube; fi ;;
    squid) squid_aplicar ;;
    registro) registro "${2:-15}" ;;
    trafico) trafico ;;
    informe) informe ;;
    haproxy) haproxy_aplicar ;;
    tumbar) web_nodo tumbar "${2:-}" ;;
    keepalived) keepalived_aplicar ;;
    vrrp) vrrp "${2:-8}" ;;
    caer) caer "${2:-}" ;;
    levantar) levantar "${2:-}" ;;
    failover) failover ;;
    copia) copia ;;
    copias) copias ;;
    programar) programar ;;
    desastre) desastre ;;
    plan) necesita_lab; en datos python3 /usr/local/bin/continuidad.py formato ;;
    comprobar) comprobar "${2:-todo}" ;;
    entregar) entregar ;;
    solucion) solucion "${2:-}" ;;
    cargar) cargar "${2:-}" "${3:-}" ;;
    ayuda|-h|--help) ayuda ;;
    *) error "No conozco la orden «$1»."; ayuda; exit 1 ;;
esac
