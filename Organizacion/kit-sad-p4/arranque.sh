#!/bin/bash
# Arranque de cada máquina de la P4 según su ROL: auditor, web, archivo, recepcion o atacante (el SIEM es Wazuh).
set -u
ROL=${ROL:-?}

case "$ROL" in
  auditor) C=32 ;; web) C=33 ;; archivo) C=36 ;; recepcion) C=35 ;; atacante) C=31 ;; *) C=37 ;;
esac
grep -q "PS1=" /root/.bashrc || echo "PS1='\[\e[1;${C}m\]${ROL}\[\e[0m\]:\w# '" >> /root/.bashrc

# Lo que se crea aquí dentro es de root y desde tu ordenador no podrías editarlo: cada 2 s pasa a ser tuyo
for d in /lab /evidencias; do
  [ -d "$d" ] && ( while sleep 2; do find "$d" ! -user "$(stat -c %u "$d")" -exec chown -h "$(stat -c %u:%g "$d")" {} + 2>/dev/null; done ) &
done

syslog() { sed -i '/imklog/s/^/#/' /etc/rsyslog.conf; rm -f /run/rsyslogd.pid; rsyslogd; }
# SSH «de toda la vida»: sin el castigo automático por fallos de OpenSSH 9.8+ (PerSourcePenalties), como un servidor antiguo
ssh_lab() { echo "PerSourcePenalties no" > /etc/ssh/sshd_config.d/lab.conf; mkdir -p /run/sshd; ssh-keygen -A >/dev/null 2>&1; /usr/sbin/sshd; }

case "$ROL" in
  auditor)
    cp -n /usr/share/lab/diccionario.txt /lab/diccionario.txt 2>/dev/null
    ;;

  web)
    # La web de citas de la clínica: una cara a Internet (198.18.40.10) y otra a la red interna (10.40.0.10)
    if [ ! -e /etc/lab/sembrado ]; then
      mkdir -p /etc/lab
      echo "root:$(head -c 12 /dev/urandom | base64)" | chpasswd
      useradd -m -s /bin/bash citas && echo "citas:dientes2026" | chpasswd     # la contraseña débil (bloque B)
      mkdir -p /var/www/html/uploads /var/www/html/img /var/www/html/exportar /var/www/html/.git
      cat > /var/www/html/index.html <<'EOF'
<!doctype html><html lang="es"><meta charset="utf-8"><title>Clínica dental Sonríe</title>
<h1>Clínica dental Sonríe</h1><p>Pide tu cita en línea. Sube tu radiografía o tu informe antes de venir.</p>
<form action="/uploads/" method="post" enctype="multipart/form-data">Tu radiografía: <input type="file" name="rx"></form>
</html>
EOF
      echo "logo" > /var/www/html/img/logo.png
      printf "User-agent: *\nDisallow: /exportar/\n" > /var/www/html/robots.txt
      printf '%s\n' '<?php' '// Pide cita: guarda el nombre y el teléfono' 'echo "Gracias, te llamamos para confirmar la cita";' '?>' > /var/www/html/cita.php
      chown citas /var/www/html/uploads              # la web de citas guarda aquí lo que suben los pacientes
      cat > /var/www/html/exportar/agenda-2026.csv <<'EOF'
fecha;hora;paciente;telefono;tratamiento;alergias
2026-12-01;09:30;Marta Ruiz Sanz;600111222;Endodoncia pieza 36;Penicilina
2026-12-01;10:15;Jorge Gil Peña;600333444;Limpieza;-
EOF
      printf '[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = https://web:Sonrie-Git-31@git.clinica-sonrie.es/citas.git\n' > /var/www/html/.git/config
      echo "ref: refs/heads/main" > /var/www/html/.git/HEAD
      touch /etc/lab/sembrado
    fi
    cat > /etc/nginx/sites-enabled/web <<'EOF'
server {
  listen 80 default_server;
  root /var/www/html;
  server_tokens on;                        # dice su versión
  location /exportar/ { autoindex on; }    # listado de directorios
  location /uploads/ { autoindex off; }
}
EOF
    syslog; ssh_lab; nginx; cron
    ;;

  archivo)
    # El servidor de archivo: FTP anónimo, SSH con una contraseña débil y Redis sin contraseña en un puerto alto
    if [ ! -e /etc/lab/sembrado ]; then
      mkdir -p /etc/lab
      echo "root:$(head -c 12 /dev/urandom | base64)" | chpasswd
      useradd -m -s /bin/bash higienista && echo "higienista:sonrisa2025" | chpasswd
      mkdir -p /srv/ftp/publico
      printf 'Router de la clínica (fibra)\nusuario: admin\ncontraseña: Router-Sonrie-9\n' > /srv/ftp/publico/router.txt
      echo "Carpeta pública de la clínica: folletos y consentimientos en blanco" > /srv/ftp/publico/LEEME.txt
      touch /etc/lab/sembrado
    fi
    cat > /etc/vsftpd.conf <<'EOF'
listen=YES
anonymous_enable=YES
anon_root=/srv/ftp
no_anon_password=YES
local_enable=NO
write_enable=NO
secure_chroot_dir=/var/run/vsftpd/empty
ftpd_banner=FTP de la Clinica Sonrie
pasv_enable=YES
pasv_min_port=30000
pasv_max_port=30010
EOF
    mkdir -p /var/run/vsftpd/empty && (vsftpd /etc/vsftpd.conf &)
    syslog; ssh_lab
    redis-server --port 16379 --bind 0.0.0.0 --protected-mode no --daemonize yes >/dev/null
    # Un IDS vigila la tarjeta del archivo (UD5): avisa si alguien barre los puertos o prueba muchas contraseñas
    mkdir -p /etc/suricata/lab /var/log/suricata
    cat > /etc/suricata/lab/local.rules <<'EOF'
alert tcp any any -> $HOME_NET any (msg:"LAB escaneo de puertos (muchos SYN seguidos)"; flags:S; threshold: type both, track by_src, count 20, seconds 60; sid:1000002; rev:1;)
alert tcp any any -> $HOME_NET 22 (msg:"LAB muchos intentos de SSH (fuerza bruta)"; flags:S; threshold: type both, track by_src, count 10, seconds 60; sid:1000004; rev:1;)
EOF
    i=$(ip -4 -o addr | awk '/10\.40\.0\./{print $2; exit}')
    suricata -c /etc/suricata/suricata.yaml -S /etc/suricata/lab/local.rules -l /var/log/suricata -k none -D \
      --pidfile /run/suricata.pid --set "vars.address-groups.HOME_NET=[10.40.0.0/24]" --af-packet="$i" >/dev/null 2>&1
    ;;

  recepcion)
    # El ordenador de recepción: solo SSH (para el soporte informático), con una contraseña larga. No es un fallo.
    if [ ! -e /etc/lab/sembrado ]; then
      mkdir -p /etc/lab
      echo "root:$(head -c 12 /dev/urandom | base64)" | chpasswd
      useradd -m -s /bin/bash soporte && echo "soporte:$(head -c 15 /dev/urandom | base64)" | chpasswd
      touch /etc/lab/sembrado
    fi
    syslog; ssh_lab
    ;;

  atacante)
    # Alguien en Internet (198.18.40.66). En el bloque B ataca la web: ./lab.sh incidente
    ;;
esac
echo "$ROL listo"
exec sleep infinity
