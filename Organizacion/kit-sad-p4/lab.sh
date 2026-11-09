#!/usr/bin/env bash
#
# lab.sh — Mando a distancia de la Práctica 4 de SAD · Clínica dental Sonríe
#          (bloque A: auditoría y hacking ético · bloque B: forense, malware y SIEM).
#
# No necesitas saber Docker: todo lo que hace falta está aquí.
#   ./lab.sh ayuda        -> lista de órdenes
#
set -uo pipefail
cd "$(dirname "$0")"

MAQUINAS="auditor web archivo recepcion atacante siem"
c() { echo "sad-p4-$1"; }
# Fechas (las del calendario): avance del bloque A al acabar la UD7; entrega de A y B; defensa
AVANCE_A="mié 9/12, 23:59"; ENTREGA="lun 14/12, 23:59"; DEFENSA="mié 16/12"

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
        corriendo "$m" || { error "El laboratorio no está arrancado (falta «$m»)."; echo "  Arráncalo con:  ./lab.sh arrancar"; exit 1; }
    done
}
en() { local m=$1; shift; docker exec "$(c "$m")" "$@"; }

# Una prueba: descripción («A3 · …»), máquina y orden. Si la orden sale bien, ✔; si no, ✘ y la pista.
# Las 👀 son ejemplos resueltos: se enseñan, pero no cuentan.
OK_A=0; TOT_A=0; OK_B=0; TOT_B=0
prueba() {
    local desc=$1 maq=$2 orden=$3 pista=${4:-} b
    b=${desc:0:1}
    if en "$maq" bash -c "$orden" >/dev/null 2>&1; then
        bien "$desc"; [[ $desc == 👀* ]] || { eval "OK_$b=\$((OK_$b + 1))"; eval "TOT_$b=\$((TOT_$b + 1))"; }
    else
        echo "${R}✘${X} $desc"; [ -n "$pista" ] && echo "    ${A}💡${X} $pista"
        [[ $desc == 👀* ]] || eval "TOT_$b=\$((TOT_$b + 1))"
    fi
}

ayuda() {
    cat <<EOF
${N}Práctica 4 de SAD · Clínica dental Sonríe${X}

  «Internet» 198.18.40.0/24    Red de la clínica 10.40.0.0/24                              Gestión 10.40.9.0/24
  atacante .66 ──── web .10 ──── web .10 · archivo .20 · recepcion .30 · auditor .50 (tú)   siem .40 (Wazuh)
                                 (el SIEM no está en la red: lee los registros de la web)

${N}Arrancar y parar${X}
  ./lab.sh arrancar        crea y arranca las 6 máquinas (la primera vez tarda unos minutos)
  ./lab.sh parar           las apaga (tus ficheros se quedan en esta carpeta)
  ./lab.sh reiniciar       las crea de nuevo DESDE CERO: borra los registros y el incidente
  ./lab.sh estado          qué máquinas están en marcha

${N}Entrar en una máquina${X} (sales con exit)
  ./lab.sh auditor · web · archivo · recepcion · atacante

${N}Bloque A · La auditoría${X} (desde el auditor; lo que escribes va en ${N}informe/${X})
  ./lab.sh ids             qué ha visto el IDS del archivo mientras auditabas

${N}Bloque B · El incidente${X} (lo que escribes va en ${N}forense/${X} y ${N}siem/reglas/${X})
  ./lab.sh incidente       el atacante ataca la web DE VERDAD (una sola vez; para repetir: reiniciar)
  ./lab.sh yara            pasa tus reglas de forense/reglas/ por la web y las carpetas de los usuarios
  ./lab.sh siem            comprueba siem/reglas/local_rules.xml y lo aplica (si hay un error, te dice cuál)
  ./lab.sh alertas [n]     las últimas alertas del SIEM (nivel 5 o más)
  ./lab.sh logtest         prueba a mano una línea de registro contra las reglas (sales con Ctrl+C)

${N}Comprobar y entregar${X}
  ./lab.sh comprobar [a|b] qué está bien y qué falta (sin letra, los dos bloques y la calidad)
  ./lab.sh entregar        guarda el informe y te dice cómo subirlo a tu repositorio

  Avance del bloque A: ${AVANCE_A} · Entrega: ${ENTREGA} · Defensa: ${DEFENSA}
EOF
    [ -d solucion ] && echo -e "\n${N}Profesor${X}\n  ./lab.sh solucion a|b       carga la solución (guarda antes una copia de lo que hubiera en copias/)\n  ./lab.sh cargar DIR [AAAA-MM-DD]  carga la carpeta del kit de un alumno y la comprueba (con fecha: lo subido ese día a las 23:59)"
}

arrancar() {
    necesita_docker
    # (Solo en la carpeta del profesor, que tiene los scripts sueltos: se vuelven a empaquetar en maquinas.b64)
    [ -f arranque.sh ] && tar -cz arranque.sh incidente.sh huella.sh | base64 > maquinas.b64
    info "Arrancando el laboratorio (el SIEM tarda un minuto en estar listo)…"
    docker compose up -d --build >/dev/null 2>&1 || { error "No se pudo arrancar. Prueba:  docker compose up --build  (y mira el error)"; exit 1; }
    sleep 5
    for m in $MAQUINAS; do corriendo "$m" && bien "$m en marcha" || error "$m no arrancó: docker logs $(c "$m")"; done
    echo; echo "Ahora: ${N}./lab.sh ayuda${X} para ver qué hacer."
}

# ---------- bloque A ----------
ids() {
    necesita_lab
    en archivo sh -c 'test -s /var/log/suricata/eve.json && jq -r "select(.event_type==\"alert\") | \"\(.timestamp[11:19])  \(.src_ip) → \(.dest_ip):\(.dest_port)  \(.alert.signature)\"" /var/log/suricata/eve.json | tail -n 20' \
        | grep . || aviso "El IDS no ha visto nada todavía"
}

# ---------- bloque B ----------
incidente() {
    necesita_lab
    if en web test -e /etc/lab/incidente; then
        aviso "El ataque ya se hizo (a las $(en web cat /etc/lab/incidente))."
        echo "  Si quieres repetirlo desde cero:  ./lab.sh reiniciar   (borra registros, evidencias del sistema y alertas)"
        return
    fi
    info "El atacante (198.18.40.66) ataca la web de citas de la clínica. Tarda un minuto…"
    en atacante incidente.sh || { error "El ataque no ha salido. Prueba  ./lab.sh reiniciar  y otra vez."; exit 1; }
    en web huella.sh
    bien "Ya está. Ahora eres el equipo de respuesta: ${N}./lab.sh web${X}  (y lo primero, lo más volátil)"
}
yara_pasar() {
    necesita_lab
    local f n=0
    for f in forense/reglas/*.yar; do
        [ -e "$f" ] || continue; n=$((n + 1))
        echo "${N}$(basename "$f")${X}"
        if ! en web yara -w "/evidencias/reglas/$(basename "$f")" /dev/null >/dev/null 2>"/tmp/yara.$$"; then
            error "La regla tiene un error:"; sed 's/^/    /' "/tmp/yara.$$"; rm -f "/tmp/yara.$$"; continue
        fi
        rm -f "/tmp/yara.$$"
        { for dir in /var/www/html /home /var/tmp; do en web yara -w -r "/evidencias/reglas/$(basename "$f")" "$dir" 2>/dev/null; done; } \
            | sed 's/^/  ✔ salta con /' | grep . || echo "  (no salta con nada)"
    done
    [ "$n" -gt 0 ] || aviso "No hay reglas en forense/reglas/"
}
siem() {
    necesita_lab
    info "Comprobando siem/reglas/local_rules.xml…"
    local T; T=$(en siem sh -c 'cd /var/ossec && bin/wazuh-analysisd -t 2>&1'); local rc=$?
    if [ $rc -ne 0 ] || echo "$T" | grep -q "ERROR"; then
        error "Hay un error en tus reglas. No he aplicado nada: el SIEM sigue con las de antes."
        echo "$T" | grep -E "ERROR|CRITICAL" | sed 's/^.*wazuh-analysisd: /    /' | head -5; return 1
    fi
    en siem /var/ossec/bin/wazuh-control restart >/dev/null 2>&1
    bien "Reglas aplicadas ($(grep -c '<rule id=' siem/reglas/local_rules.xml) reglas tuyas). Pruébalas:  ./lab.sh logtest  ·  ./lab.sh alertas"
}
alertas() {
    necesita_lab
    en siem cat /var/ossec/logs/alerts/alerts.json 2>/dev/null \
        | docker exec -i "$(c auditor)" jq -r 'select(.rule.level >= 5) | "\(.timestamp[11:19])  nivel \(.rule.level)  [\(.rule.id)]  \(.data.srcip // "-")  \(.rule.description)"' \
        | tail -n "${1:-20}" | grep . || aviso "Todavía no hay alertas (¿has lanzado ./lab.sh incidente?)"
}

# ---------- comprobar ----------
# Lo que hay detrás de los dos puntos en la línea de hallazgos.md que contiene ese texto (sin espacios ni comillas)
dato() { echo "sed -n 's/^- $1[^:]*:[[:space:]]*//p' /lab/hallazgos.md | head -1 | tr -d ' \\r\\140\"'"; }
# ¿Es el valor correcto? Se compara su huella (SHA-256), para que el comprobador no lleve las respuestas
es() { echo "[ \"\$($(dato "$1") | sed 's#.*/##' | tr -d '\\n' | sha256sum | cut -c1-16)\" = $2 ]"; }
comprobar_a() {
    echo "${N}Bloque A · Descubrir e inventariar${X}"
    prueba "A1 · hosts.txt: las tres máquinas de la clínica (y ni la tuya ni la .1)" auditor \
        "[ \"\$(grep -v '^#' /lab/hosts.txt | grep -oE '10\.40\.0\.[0-9]+' | sort -u | tr '\n' ' ')\" = '10.40.0.10 10.40.0.20 10.40.0.30 ' ]" \
        "¿quién contesta en la red? Quita tu máquina y la puerta de enlace"
    local linea='grep -v "^#" /lab/inventario.txt | grep -qE' pa=$((0x3FFB))
    prueba "A2 · inventario.txt: la web (10.40.0.10), con su servidor web y su versión" auditor \
        "$linea '^10\.40\.0\.10[[:space:]]+80/tcp.*nginx.*1\.[0-9]+'" "la versión de cada servicio no sale en un escaneo normal"
    prueba "A2 · inventario.txt: el archivo (10.40.0.20) y recepción (10.40.0.30)" auditor \
        "$linea '^10\.40\.0\.20[[:space:]]+21/tcp' && $linea '^10\.40\.0\.20[[:space:]]+22/tcp' && $linea '^10\.40\.0\.30[[:space:]]+22/tcp'" \
        "una línea por cada puerto abierto de cada máquina"
    prueba "A2 · inventario.txt: …y el servicio que no está en su puerto de siempre" auditor \
        "$linea '^10\.40\.0\.20[[:space:]]+$pa/tcp.*redis'" "¿cuántos puertos mira nmap si no le dices nada?"
    prueba "A2 · inventario.txt: sin puertos que no existen" auditor \
        "[ \$(grep -v '^#' /lab/inventario.txt | grep -cE '^10\.40\.0\.') -ge 6 ] && ! grep -v '^#' /lab/inventario.txt | grep -E '^10\.40\.0\.' | grep -vE '^10\.40\.0\.10[[:space:]]+(22|80)/tcp|^10\.40\.0\.20[[:space:]]+(21|22|$pa)/tcp|^10\.40\.0\.30[[:space:]]+22/tcp' | grep -q ." \
        "hay alguna línea que no corresponde a un puerto abierto: ¿te lo has inventado o es de otra máquina?"
    echo; echo "${N}Bloque A · Los fallos (las pruebas, en hallazgos.md)${X}"
    prueba "A3 · El fichero con datos de pacientes que se ve en la web" auditor "$(es 'A3 · Fichero' a9da20eb44c923d6)" \
        "lo que la web pide a los buscadores que no miren"
    prueba "A3 · La contraseña escondida en /.git/config" auditor "$(es 'A3 · Contraseña' e0f0c195c7d62c75)" \
        "una carpeta que no debería estar en la web, con un fichero de configuración dentro"
    prueba "A4 · La contraseña del router del FTP anónimo" auditor "$(es A4 bae3c5f5f5f9adf4)" \
        "¿deja entrar el FTP sin usuario? ¿Qué carpetas tiene?"
    prueba "A5 · La contraseña débil del usuario higienista" auditor "$(es A5 e3af8bb0d3d93f1d)" \
        "fuerza bruta por diccionario, despacio (-t 4), contra el servicio de entrar en remoto"
    prueba "A6 · La versión del servicio que contesta a cualquiera" auditor "$(es A6 18b22b5b14eb8bf8)" \
        "su cliente, con la máquina y el puerto que encontraste, y la orden que da información del servidor"
    echo; echo "${N}Bloque A · El informe${X}"
    local filas="grep -E '^\| *H[0-9]+ *\|' /lab/hallazgos.md | awk -F'|' '{gsub(/ /,\"\",\$5); gsub(/^ +| +\$/,\"\",\$6); if (\$5 != \"\") print \$5\"|\"\$6}'"
    prueba "A7 · Al menos 6 hallazgos con su nota CVSS (H1 + 5 tuyos)" auditor \
        "[ \$($filas | grep -cE '^(10(\.0)?|[0-9](\.[0-9])?)\|') -ge 6 ]" "un hallazgo por cada fallo de A3 a A6 (A3 son dos), con la nota de 0.0 a 10.0"
    prueba "A7 · La gravedad de cada uno es la que toca a su nota" auditor \
        "[ \$($filas | wc -l) -ge 6 ] && $filas | awk -F'|' '{n=\$1+0; g=(n>=9?\"Crítica\":n>=7?\"Alta\":n>=4?\"Media\":\"Baja\"); if (g!=\$2) exit 1}'" \
        "mira la escala de la cabecera de la tabla (y «Crítica» con tilde)"
    prueba "A7 · Ordenados de más grave a menos" auditor \
        "[ \$($filas | wc -l) -ge 6 ] && $filas | awk -F'|' 'NR>1 && \$1+0 > p {exit 1} {p=\$1+0}'" "lo primero que se arregla es lo más grave"
    prueba "A7 · El más grave es el servicio que contesta sin contraseña (9.0 o más)" auditor \
        "$filas | head -1 | awk -F'|' '{exit !(\$1+0 >= 9)}' && grep -E '^\| *H[0-9]+ *\|' /lab/hallazgos.md | head -1 | grep -qi redis" \
        "¿qué puede hacer cualquiera de la red con un servicio que no pide nada?"
}

# La verdad del ataque la apunta la propia web al acabar ./lab.sh incidente (/etc/lab/verdad, solo root):
# así el comprobador no lleva las respuestas. Cada prueba del bloque B empieza cargándola.
VERDAD='. /etc/lab/verdad;'
comprobar_b() {
    if ! en web test -e /etc/lab/verdad; then
        echo "${N}Bloque B${X}"; echo "${R}✘${X} B · Todavía no ha habido ataque: lanza antes  ./lab.sh incidente"; TOT_B=21; return
    fi
    local lt='/evidencias/linea-temporal.txt'
    valor() { echo "sed -n 's/^$1[[:space:]]*=[[:space:]]*//p' $lt | tr -d ' \r'"; }
    hora() { echo "v=\$($(valor "$1")); [ -n \"\$v\" ] && d=\$(( \$(date -u -d \"\$v\" +%s) - \$(date -u -d \"\$$2\" +%s) )) && [ \${d#-} -le 2 ]"; }

    echo "${N}Bloque B · Lo volátil, primero${X}"
    prueba "B1 · volatiles.txt: el proceso extraño que estaba corriendo" web "$VERDAD grep -v '^#' /evidencias/volatiles.txt | grep -q \"\$PROC\"" \
        "lo que se pierde si se apaga: los procesos (y antes de tocar nada)"
    prueba "B1 · volatiles.txt: …y su conexión abierta hacia fuera" web "$VERDAD grep -v '^#' /evidencias/volatiles.txt | grep -q \"\$C2\"" \
        "¿con quién está hablando la máquina? (las conexiones, con el programa de cada una)"
    echo; echo "${N}Bloque B · Evidencias, hashes y cadena de custodia${X}"
    prueba "B2 · copias/: la webshell que ejecuta órdenes, auth.log y access.log copiados" web \
        "$VERDAD sha256sum /evidencias/copias/* 2>/dev/null | grep -q \"^\$HASH\" && [ -s /evidencias/copias/auth.log ] && [ -s /evidencias/copias/access.log ]" \
        "en /evidencias/copias/, copiadas sin abrirlas y conservando la fecha"
    prueba "B2 · evidencias.sha256: los hashes de las copias, y cuadran" web \
        "cd /evidencias && [ \$(grep -c 'copias/' evidencias.sha256) -ge 3 ] && sha256sum -c --quiet evidencias.sha256" \
        "un fichero /evidencias/evidencias.sha256 que se pueda comprobar con sha256sum -c"
    prueba "B3 · custodia.md: el hash de la webshell apuntado en su fila" web "$VERDAD grep -q \"\$HASH\" /evidencias/custodia.md" \
        "el SHA-256 completo (64 caracteres) en la fila E2"
    echo; echo "${N}Bloque B · La línea temporal (horas en UTC, ±2 s)${X}"
    prueba "B4 · Quién: la IP del atacante y el usuario que usó" web \
        "$VERDAD [ \"\$($(valor ip_atacante))\" = \"\$IP\" ] && [ \"\$($(valor usuario))\" = \"\$USUARIO\" ]" "la entrada que funcionó, en el registro de SSH"
    prueba "B4 · primer_fallo_ssh y acceso_ssh" web "$VERDAD $(hora primer_fallo_ssh PRIMER) && $(hora acceso_ssh ACCESO)" \
        "el primer fallo y la primera entrada de esa IP"
    prueba "B4 · webshell_creada" web "$VERDAD $(hora webshell_creada CREADA)" "la fecha del fichero, no la de cuando lo miras"
    prueba "B4 · webshell_usada" web "$VERDAD $(hora webshell_usada USADA)" "la primera petición a la webshell, en el registro de la web"
    prueba "B4 · La puerta trasera: el programa (ruta completa) y dónde se programa para volver" web \
        "$VERDAD [ \"\$($(valor proceso))\" = \"\$RUTA\" ] && $(valor persistencia) | grep -qi 'cron' && $(valor persistencia) | grep -q \"\$USUARIO\"" \
        "¿qué programa es de verdad ese proceso? ¿Y qué lo vuelve a arrancar?"
    echo; echo "${N}Bloque B · Malware: YARA${X}"
    prueba "👀 B5 · eicar.yar encuentra el fichero de prueba EICAR" web \
        "printf '%s' 'X5O!P%@AP[4\\PZX54(P^)7CC)7}\$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!\$H+H*' > /tmp/.e && yara /evidencias/reglas/eicar.yar /tmp/.e | grep -q ."
    local limpio='! yara -w /evidencias/reglas/webshell.yar /var/www/html/cita.php | grep -q . && ! yara -w /evidencias/reglas/webshell.yar /var/www/html/index.html | grep -q . && yara -w /evidencias/reglas/webshell.yar /dev/null'
    local ws1="printf '%s\n' '<?php' '// visor' 'if (!empty(\$_REQUEST[\"c\"])) { passthru(\$_REQUEST[\"c\"]); }' '?>' > /tmp/.p1.php"
    local ws2="printf '%s\n' '<?php' '@eval(gzinflate(base64_decode(\$_POST[\"x\"])));' '?>' > /tmp/.p2.php"
    prueba "B5 · webshell.yar encuentra la webshell que ejecuta órdenes" web "$limpio && $ws1 && yara -w /evidencias/reglas/webshell.yar /tmp/.p1.php | grep -q ." \
        "¿qué función usa para ejecutar lo que le llega?"
    prueba "B5 · …y la otra, la escondida" web "$limpio && $ws2 && yara -w /evidencias/reglas/webshell.yar /tmp/.p2.php | grep -q ." \
        "hay una segunda webshell (ls -la): ¿cómo esconde lo que ejecuta?"
    prueba "B5 · …pero NO salta con cita.php (un PHP normal): sin falsos positivos" web \
        "$ws1 && yara -w /evidencias/reglas/webshell.yar /tmp/.p1.php | grep -q . && $limpio" "«<?php» solo no basta: está en todos los PHP"
    echo; echo "${N}Bloque B · SIEM (Wazuh): tus reglas${X}"
    local web1='203.0.113.99 - - [07/Dec/2026:10:00:00 +0000] "GET /uploads/x.php?c=id HTTP/1.1" 200 60 "-" "curl"'
    local norm='203.0.113.99 - - [07/Dec/2026:10:00:00 +0000] "GET /cita.php?c=ana HTTP/1.1" 200 60 "-" "curl"'
    local otro='203.0.113.99 - - [07/Dec/2026:10:00:00 +0000] "GET /uploads/foto.png?c=1 HTTP/1.1" 200 60 "-" "curl"'
    prueba "B6 · Regla 100020: una webshell en /uploads/ salta (nivel 12)" siem \
        "printf '%s\n' '$web1' | /var/ossec/bin/wazuh-logtest 2>&1 | grep -A3 \"id: '100020'\" | grep -q \"level: '12'\"" \
        "./lab.sh siem para aplicarla y ./lab.sh logtest con una línea del ataque (míralas en access.log)"
    prueba "B6 · …y una visita normal (un PHP fuera de /uploads/, o una imagen) no salta" siem \
        "grep -q 'id=\"100020\"' /var/ossec/lab-reglas/local_rules.xml && ! printf '%s\n' '$norm' '$otro' | /var/ossec/bin/wazuh-logtest 2>&1 | grep -qE \"id: '10002[01]'\"" \
        "dos condiciones a la vez: dónde está y qué se le pide"
    local fuerza; fuerza=$(for i in 1 2 3 4 5 6 7 8 9; do printf '2026-12-07T10:00:0%s.000000+00:00 web sshd-session[9%s]: Failed password for pepe from IPX port 4000%s ssh2\\n' "$i" "$i" "$i"; done)
    prueba "B6 · Regla 100021: fuerza bruta y LUEGO webshell desde la MISMA IP → nivel 15" siem \
        "printf '${fuerza//IPX/203.0.113.77}%s\n' '${web1//203.0.113.99/203.0.113.77}' | /var/ossec/bin/wazuh-logtest 2>&1 | grep -A3 \"id: '100021'\" | grep -q \"level: '15'\"" \
        "una correlación: lo de antes, la ventana de tiempo y la misma IP"
    prueba "B6 · …pero si la webshell la usa OTRA IP, solo salta la 100020" siem \
        "o=\$(printf '${fuerza//IPX/203.0.113.77}%s\n' '$web1' | /var/ossec/bin/wazuh-logtest 2>&1); echo \"\$o\" | tail -20 | grep -q \"id: '100020'\" && ! echo \"\$o\" | grep -q \"id: '100021'\"" \
        "si vale cualquier IP, no es correlación"
    echo; echo "${N}Bloque B · Contener y erradicar (después de recoger las evidencias)${X}"
    if [ -n "${CARGADO:-}" ]; then
        # Corrigiendo una entrega: la contención solo se ve en la máquina del alumno. Se toma de su entrega/informe.txt
        # (lo que le dio ./lab.sh entregar) y se confirma en la defensa.
        local l n=0
        while IFS= read -r l; do
            n=$((n + 1)); TOT_B=$((TOT_B + 1))
            case "$l" in "✔ B7"*) OK_B=$((OK_B + 1)); bien "${l#✔ } (según su entrega/informe.txt)" ;; *) echo "${R}✘${X} ${l#✘ } (según su entrega/informe.txt)" ;; esac
        done < <(grep -E '^(✔|✘) B7 ·' "$CARGADO/entrega/informe.txt" 2>/dev/null)
        [ "$n" -gt 0 ] || { TOT_B=$((TOT_B + 4)); echo "${R}✘${X} B7 · Sin entrega/informe.txt: la contención no se puede comprobar (4 pruebas)"; }
        return
    fi
    prueba "B7 · La puerta trasera ya no corre, ni vuelve" web \
        "$VERDAD [ -z \"\$(ps -eo stat=,comm= | awk -v p=\"\$PROC\" '\$2==p && \$1 !~ /Z/')\" ] && ! crontab -u \"\$USUARIO\" -l 2>/dev/null | grep -q \"\$PROC\" && [ ! -e \"\$RUTA\" ]" \
        "el proceso, lo que lo vuelve a arrancar y el programa"
    prueba "B7 · Las dos webshells y el EICAR, fuera de la web" web \
        "$VERDAD [ ! -e \"\$WS1\" ] && [ ! -e \"\$WS2\" ] && [ ! -e \"\$EICAR\" ]" \
        "¿has visto el fichero que empieza por punto?"
    local clave usuario; clave=$(en web sh -c '. /etc/lab/verdad; echo "$CLAVE"'); usuario=$(en web sh -c '. /etc/lab/verdad; echo "$USUARIO"')
    prueba "B7 · La contraseña robada ya no sirve" atacante \
        "! sshpass -p '$clave' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 $usuario@198.18.40.10 true" \
        "el atacante la sigue teniendo"
    local w1; w1=$(en web sh -c '. /etc/lab/verdad; echo "${WS1#/var/www/html}"')
    prueba "B7 · …y la web de citas sigue funcionando para los pacientes" atacante \
        "! curl -sf -o /dev/null --max-time 5 http://198.18.40.10$w1 && curl -sf -o /dev/null --max-time 5 http://198.18.40.10/" \
        "contener no es apagar"
}

# Calidad (1 punto por bloque = 0,5 + 0,5): lo que se puede medir sin opinar
calidad() {
    echo "${N}Calidad${X}"
    local h=informe/hallazgos.md
    local ids; ids=$(grep -oE '^\| *H[0-9]+ *\|' "$h" 2>/dev/null | tr -dc 'H0-9\n' | sort -u)
    local rec; rec=$(grep -oE '^- H[0-9]+' "$h" 2>/dev/null | tr -dc 'H0-9\n' | sort -u)
    local res; res=$(sed -n '/^## Resumen/,/^## Pruebas/p' "$h" 2>/dev/null | grep -vE '^##|^$|✍️' | wc -w)
    if [ "$(echo "$ids" | grep -c .)" -ge 6 ] && [ -z "$(comm -23 <(echo "$ids") <(echo "$rec"))" ] && [ "$res" -ge 25 ]; then
        bien "A · Resumen para la dirección y una recomendación por hallazgo"; CAL_A1=1
    else echo "${R}✘${X} A · Falta el resumen para la dirección (unas tres líneas) o alguna recomendación (- Hn: …)"; CAL_A1=0; fi
    if grep -q '^\*\*Autorización:\*\*' "$h" && grep -q '^\*\*Alcance:\*\*' "$h" && grep -E '^\*\*Auditor/a:\*\*' "$h" | grep -qv '✍️' \
        && grep -E '^\*\*Auditor/a:\*\*' "$h" | grep -qE ':\*\* *[[:alpha:]]{2,}'; then
        bien "A · La cabecera del informe: autorización, alcance y tu nombre"; CAL_A2=1
    else echo "${R}✘${X} A · La cabecera del informe: falta tu nombre o has borrado la autorización o el alcance"; CAL_A2=0; fi
    if corriendo siem && [ -n "$(en siem sh -c 'cd /var/ossec && bin/wazuh-analysisd -t 2>&1' | grep -E 'ERROR|CRITICAL' || true)" ]; then
        echo "${R}✘${X} B · local_rules.xml tiene errores (wazuh-analysisd -t)"; CAL_B1=0
    elif corriendo web && en web yara -w /evidencias/reglas/webshell.yar /dev/null >/dev/null 2>&1 \
        && [ "$(grep -cE '^[[:space:]]*\$[a-z0-9_]* *=' forense/reglas/webshell.yar)" -ge 3 ] \
        && grep -q 'id="100020"' siem/reglas/local_rules.xml && grep -q 'id="100021"' siem/reglas/local_rules.xml; then
        bien "B · Tus reglas del SIEM y de YARA cargan sin errores ni avisos"; CAL_B1=1
    else echo "${R}✘${X} B · webshell.yar no carga (o da avisos), o faltan tus reglas (las cadenas de YARA, la 100020 o la 100021)"; CAL_B1=0; fi
    if [ "$(grep -cE '^\| *E[1-3] *\|' forense/custodia.md)" = 3 ] && ! grep -E '^\| *E[1-3] *\|' forense/custodia.md | grep -q '✍️' \
        && [ "$(grep -E '^\| *E[1-3] *\|' forense/custodia.md | grep -oE '[0-9a-f]{64}' | wc -l)" = 3 ]; then
        bien "B · La cadena de custodia completa: tres evidencias, cada una con su hash, quién y cuándo"; CAL_B2=1
    else echo "${R}✘${X} B · La cadena de custodia tiene huecos (✍️) o le falta algún hash"; CAL_B2=0; fi
}

comprobar() {
    necesita_lab
    OK_A=0; TOT_A=0; OK_B=0; TOT_B=0; CAL_A1=0; CAL_A2=0; CAL_B1=0; CAL_B2=0
    case "${1:-todo}" in
        a|A) comprobar_a ;;
        b|B) comprobar_b ;;
        *) comprobar_a; echo; comprobar_b; echo; calidad ;;
    esac
    echo
    local b
    for b in A B; do
        local tot=TOT_$b ok=OK_$b
        [ "${!tot}" -gt 0 ] && echo "${N}Bloque $b:${X} ${!ok} de ${!tot} pruebas  →  funciona $(awk "BEGIN{printf \"%.1f\", 5*${!ok}/${!tot}}") de 5"
    done
    if [ "${1:-todo}" = todo ]; then
        echo "${N}Calidad:${X} A $(awk "BEGIN{printf \"%.1f\", 0.5*$CAL_A1+0.5*$CAL_A2}") de 1 · B $(awk "BEGIN{printf \"%.1f\", 0.5*$CAL_B1+0.5*$CAL_B2}") de 1"
        echo "(el avance, 2,5, y Git, 1,5, los pone el profesor al ver tu repositorio)"
    fi
    echo "(los 👀 no cuentan: son los ejemplos resueltos)"
}

entregar() {
    necesita_lab
    mkdir -p entrega
    info "Comprobando tu práctica para guardar el informe en la entrega…"
    comprobar | sed 's/\x1b\[[0-9;]*m//g' > entrega/informe.txt
    tail -4 entrega/informe.txt
    bien "Informe guardado en ${N}entrega/informe.txt${X}. Ahora súbelo todo a tu repositorio:"
    echo "    git add -A ."
    echo "    git commit -m \"P4 · entrega\""
    echo "    git push"
    git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
        || aviso "Esta carpeta no está dentro de tu repositorio: muévela dentro (con informe/, forense/… tal cual) y repite"
}

# ---------- profesor ----------
guardar_copia() { local f="copias/$(date +%H%M%S)"; mkdir -p "$f"; cp -r informe forense siem respuestas.md "$f"/ 2>/dev/null; aviso "Copia de lo que había en $f/"; }
solucion() {
    [ -d solucion ] || { error "Esta orden es solo del profesor."; exit 1; }
    necesita_lab; guardar_copia
    case "${1:-}" in
        a) cp solucion/a/hosts.txt solucion/a/inventario.txt solucion/a/hallazgos.md informe/; cp solucion/respuestas.md respuestas.md ;;
        b) cp solucion/b/reglas/local_rules.xml siem/reglas/
           cp solucion/b/forense/reglas/webshell.yar forense/reglas/
           siem
           en web test -e /etc/lab/incidente || incidente
           docker cp solucion/b/resolver.sh "$(c web)":/tmp/resolver.sh >/dev/null && en web bash /tmp/resolver.sh ;;
        *) error "Uso: ./lab.sh solucion a|b"; exit 1 ;;
    esac
}
cargar() {
    local d=${1:-} fecha=${2:-}
    [ -d "$d/informe" ] || { error "Uso: ./lab.sh cargar CARPETA [AAAA-MM-DD]  (la carpeta del kit en el repo del alumno, con informe/ dentro)"; exit 1; }
    if [ -n "$fecha" ]; then
        local cm t; cm=$(git -C "$d" rev-list -1 --before="$fecha 23:59:59" HEAD) || { error "No es un repositorio git"; exit 1; }
        [ -n "$cm" ] || { error "No había nada subido el $fecha"; exit 1; }
        t=$(mktemp -d); git -C "$d" archive "$cm" -- . | tar -x -C "$t"
        info "Cargando lo subido hasta el $fecha: $(git -C "$d" log -1 --format='%h · %ad · %s' --date=format:'%d/%m %H:%M' "$cm")"
        d=$t
    fi
    necesita_lab; guardar_copia
    # Se vacía y se rellena cada carpeta, sin borrarla: las máquinas la tienen montada
    # (siem/reglas está montada en el SIEM: se vacía por dentro, nunca se borra la carpeta)
    for x in informe forense siem/reglas; do
        mkdir -p "$x"; find "$x" -mindepth 1 -delete 2>/dev/null
        [ -d "$d/$x" ] && cp -r "$d/$x/." "$x/"
    done
    mkdir -p forense/reglas
    cp "$d/respuestas.md" respuestas.md 2>/dev/null || aviso "La entrega no trae respuestas.md"
    siem >/dev/null 2>&1 || aviso "Las reglas del SIEM de la entrega no cargan"
    # El bloque B se comprueba contra SU ataque: la verdad se calcula con las copias de los registros que ha subido
    # (forense/copias/auth.log y access.log). Lo fijo (IP, usuario, programa, hash de la webshell) es igual en todos.
    en web bash -c '
        a=/evidencias/copias/auth.log; w=/evidencias/copias/access.log; h() { cut -c12-19; }
        p=$(grep -m1 "Failed password.*198\.18\.40\.66" $a 2>/dev/null | h); c=$(grep -m1 "Accepted password.*198\.18\.40\.66" $a 2>/dev/null | h)
        u=$(grep -m1 "GET /uploads/radiografia.php?c=" $w 2>/dev/null | sed -E "s/.*:([0-9]{2}:[0-9]{2}:[0-9]{2}) .*/\1/")
        # La hora de creación no viaja en git: vale la suya si está entre la entrada por SSH y el primer uso
        s=$(sed -n "s/^webshell_creada[[:space:]]*=[[:space:]]*//p" /evidencias/linea-temporal.txt | tr -d " \r")
        if [ -n "$s" ] && [ -n "$c" ] && [ -n "$u" ] && [[ ! "$s" < "$c" ]] && [[ ! "$s" > "$u" ]]; then cr=$s; else cr=00:00:00; fi
        mkdir -p /etc/lab; cat > /etc/lab/verdad <<FIN
IP=198.18.40.66
USUARIO=citas
CLAVE=dientes2026
PROC=dbus-helper
RUTA=/var/tmp/.font-unix/dbus-helper
C2=198.18.40.66:8443
WS1=/var/www/html/uploads/radiografia.php
WS2=/var/www/html/uploads/.thumbs.php
EICAR=/var/www/html/uploads/presupuesto-1207.pdf
HASH=c2ac9c5f1d5876d25d0d9a67fce28ce3a94b49da903d448e78f3debba26e8530
PRIMER=${p:-00:00:00}
ACCESO=${c:-00:00:00}
CREADA=$cr
USADA=${u:-00:00:00}
FIN
        chmod 600 /etc/lab/verdad'
    CARGADO=$d comprobar
}
# ---------- fin profesor ----------

case "${1:-ayuda}" in
    arrancar) arrancar ;;
    parar) necesita_docker; docker compose stop >/dev/null 2>&1 && bien "Laboratorio parado" ;;
    reiniciar) necesita_docker; info "Borrando las máquinas y sus registros…"; docker compose down -v >/dev/null 2>&1; arrancar ;;
    estado) necesita_docker; for m in $MAQUINAS; do corriendo "$m" && bien "$m" || aviso "$m parada"; done ;;
    auditor|web|archivo|recepcion|atacante) necesita_lab; docker exec -it "$(c "$1")" bash ;;
    ids) ids ;;
    incidente) incidente ;;
    yara) yara_pasar ;;
    siem) siem ;;
    alertas) alertas "${2:-20}" ;;
    logtest) necesita_lab; docker exec -it "$(c siem)" /var/ossec/bin/wazuh-logtest ;;
    comprobar) comprobar "${2:-todo}" ;;
    entregar) entregar ;;
    solucion) solucion "${2:-}" ;;
    cargar) cargar "${2:-}" "${3:-}" ;;
    ayuda|-h|--help) ayuda ;;
    *) error "No conozco la orden «$1»."; ayuda; exit 1 ;;
esac
