#!/bin/bash
# Arranque de cada máquina de la P5 (La Taquilla) según su ROL:
#   proxy · taquilla · kiosko · calle · lb1 · lb2 · venta1 · venta2 · venta3 · datos · nuevo · nube
set -u
ROL=${ROL:-?}
case "$ROL" in
  proxy) C=36 ;; taquilla|kiosko) C=32 ;; calle) C=31 ;; lb1|lb2) C=35 ;; venta*) C=33 ;; datos|nuevo) C=34 ;; *) C=37 ;;
esac
grep -q "PS1=" /root/.bashrc || echo "PS1='\[\e[1;${C}m\]${ROL}\[\e[0m\]:\w# '" >> /root/.bashrc

# Las tarjetas de red se llaman como su red (oficina, internet, servicios) y no eth0/eth1, que cambian de orden
for dev in $(ls /sys/class/net); do
  [ "$dev" = lo ] && continue
  case "$(ip -4 -o addr show dev "$dev" | awk '{print $4}')" in
    10.70.0.*) red=oficina ;; 198.18.70.*) red=internet ;; 10.70.1.*) red=servicios ;; *) continue ;;
  esac
  [ "$dev" = "$red" ] && continue
  ip link set "$dev" down && ip link set "$dev" name "$red" && ip link set "$red" up
done
sleep 1

# Lo que se crea aquí dentro es de root y desde tu ordenador no podrías editarlo: cada 2 s pasa a ser tuyo
for d in /lab /plan /etc/squid/lab /etc/haproxy/lab /etc/keepalived/lab /etc/nube; do
  [ -d "$d" ] && ( while sleep 2; do find "$d" ! -user "$(stat -c %u "$d")" -exec chown -h "$(stat -c %u:%g "$d")" {} + 2>/dev/null; done ) &
done

case "$ROL" in
  proxy)
    # Squid con TU configuración (squid/squid.conf). Si tiene un error, no arranca (./lab.sh squid te dice cuál)
    mkdir -p /var/log/squid /var/spool/squid && chown -R proxy:proxy /var/log/squid /var/spool/squid
    touch /etc/squid/lab/usuarios 2>/dev/null
    squid -f /etc/squid/lab/squid.conf -z --foreground >/dev/null 2>&1
    rm -f /run/squid.pid
    squid -f /etc/squid/lab/squid.conf 2>/dev/null || echo "squid: la configuración tiene un error (./lab.sh squid te dice cuál)"
    ;;

  taquilla|kiosko)
    # El PC de la taquilla (personal, con usuario) y la pantalla del vestíbulo: SOLO salen por el proxy (no tienen ruta)
    ;;

  calle)
    # «Internet»: los sitios que se visitan desde la oficina (un Nginx con varios nombres)
    mkdir -p /srv/proveedor /srv/cartelera /srv/reventa /srv/apuestas
    echo '<h1>Proveedor de pulseras y acreditaciones</h1><a href="catalogo.pdf">Catálogo</a>' > /srv/proveedor/index.html
    head -c 200000 /dev/urandom > /srv/proveedor/catalogo.pdf
    for v in promo.mp4 backstage.mkv entrevista.avi; do head -c 300000 /dev/urandom > /srv/proveedor/$v; done
    for i in 1 2 3 4 5; do echo "<h1>Pedido $i</h1>" > /srv/proveedor/pedido-$i.html; done
    echo '<h1>Cartelera</h1><p>Conciertos de esta semana en la ciudad.</p>' > /srv/cartelera/index.html
    for i in 1 2 3; do echo "<h1>Concierto $i</h1>" > /srv/cartelera/concierto-$i.html; done
    echo '<h1>Reventa</h1><p>Entradas al triple de precio.</p>' > /srv/reventa/index.html
    echo '<h1>Apuestas deportivas</h1>' > /srv/apuestas/index.html
    cat > /etc/nginx/conf.d/sitios.conf <<'CONF'
server { listen 80; server_name proveedor.test;  root /srv/proveedor; expires 1h; }
server { listen 80; server_name cartelera.test;  root /srv/cartelera; expires 1h; }
server { listen 80; server_name reventa.test www.reventa.test; root /srv/reventa; }
server { listen 80; server_name apuestas.test;   root /srv/apuestas; }
CONF
    nginx
    ;;

  venta1|venta2|venta3)
    # Un nodo de la tienda de entradas. El registro apunta también X-Forwarded-For (la IP real del cliente)
    mkdir -p /srv/venta
    cat > /srv/venta/index.html <<HTML
<!doctype html><html lang="es"><meta charset="utf-8"><title>La Taquilla · Entradas</title>
<h1>La Taquilla</h1><p>Compra tus entradas. Tu cesta está guardada en este nodo.</p><p><small>Servido por ${ROL}</small></p></html>
HTML
    echo "ok ${ROL}" > /srv/venta/estado
    cat > /etc/nginx/conf.d/venta.conf <<CONF
log_format lab '\$remote_addr xff=\$http_x_forwarded_for [\$time_local] "\$request" \$status';
server {
  listen 80 default_server;
  root /srv/venta;
  access_log /var/log/nginx/access.log lab;
  add_header X-Nodo ${ROL} always;
  location = /estado { access_log off; default_type text/plain; }
}
CONF
    nginx
    ;;

  lb1|lb2)
    # Los dos balanceadores: HAProxy (haproxy/haproxy.cfg, el mismo en los dos) y Keepalived (keepalived/lbN.conf)
    haproxy -c -q -f /etc/haproxy/lab/haproxy.cfg >/dev/null 2>&1 && haproxy -D -p /run/haproxy.pid -f /etc/haproxy/lab/haproxy.cfg
    [ -s "/etc/keepalived/lab/${ROL}.conf" ] && keepalived -t -f "/etc/keepalived/lab/${ROL}.conf" >/dev/null 2>&1 \
      && keepalived -f "/etc/keepalived/lab/${ROL}.conf" -G --log-file=/var/log/keepalived.log --flush-log-file -p /run/keepalived.pid
    ;;

  datos)
    # Los datos de La Taquilla (solo la primera vez): compradores, entradas vendidas, facturas y carteles
    if [ ! -d /srv/taquilla ]; then
      mkdir -p /srv/taquilla/{compradores,entradas,facturas,carteles,tmp}
      python3 - <<'PY'
import random, unicodedata
nombres = "Lucía Hugo Martina Mateo Sofía Leo Paula Daniel Valeria Pablo Julia Álvaro Carla Adrián Noa Marcos Alba Diego Vega Iker".split()
apellidos = "García Rodríguez González Fernández López Martínez Sánchez Pérez Gómez Martín Jiménez Ruiz Hernández Díaz Moreno Muñoz".split()
conciertos = ["Rocío y los Mareas · 13/2", "Sur Eléctrico · 20/2", "Orquesta del Puerto · 27/2", "Noche Indie · 6/3"]
llano = lambda t: unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
with open("/srv/taquilla/compradores/compradores.csv", "w", encoding="utf-8") as f:
    f.write("id;nombre;apellidos;dni;telefono;email;concierto;entradas;tarjeta_ultimos4\n")
    for i in range(1, 121):
        n, a1, a2 = random.choice(nombres), random.choice(apellidos), random.choice(apellidos)
        num = random.randint(10000000, 99999999)
        f.write(f"{i:04d};{n};{a1} {a2};{num}{'TRWAGMYFPDXBNJZSQVHLCKE'[num % 23]};6{random.randint(10000000, 99999999)};"
                f"{llano(n)}.{llano(a1)}{random.randint(10, 99)}@correo.test;{random.choice(conciertos)};"
                f"{random.randint(1, 4)};{random.randint(1000, 9999)}\n")
PY
      for i in $(seq 1 80); do head -c $((15000 + RANDOM)) /dev/urandom > "/srv/taquilla/entradas/entrada-$(printf %04d "$i").pdf"; done
      for m in 11 12 01; do for i in $(seq 1 12); do head -c $((8000 + RANDOM % 4000)) /dev/urandom > "/srv/taquilla/facturas/fact-$m-$(printf %02d "$i").pdf"; done; done
      for i in $(seq 1 25); do head -c 400000 /dev/urandom > "/srv/taquilla/carteles/cartel-$(printf %02d "$i").jpg"; done
      for i in $(seq 1 20); do head -c 300000 /dev/urandom > "/srv/taquilla/tmp/sesion-$i.bin"; done
      for i in 1 2 3; do head -c 50000 /dev/urandom > "/srv/taquilla/entradas/subiendo-$i.part"; done
    fi
    mkdir -p /mnt/usb
    service cron start >/dev/null 2>&1 || cron
    ;;

  nuevo)
    # El equipo de reemplazo: un Debian recién instalado, sin los datos de La Taquilla
    mkdir -p /srv
    ;;

  nube)
    # El servicio de copias fuera de la sede: rest-server, con usuario y contraseña. Sus opciones, en TU nube/opciones
    mkdir -p /datos /etc/lab && chmod 700 /etc/lab
    [ -f /datos/.htpasswd ] || htpasswd -B -b -c /datos/.htpasswd taquilla Nube-Taquilla-27 >/dev/null 2>&1
    nube.sh
    ;;
esac

exec sleep infinity
