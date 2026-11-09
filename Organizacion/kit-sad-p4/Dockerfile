# Práctica 4 de SAD · Clínica dental Sonríe (bloque A: auditoría · bloque B: forense, malware y SIEM)
# Una sola imagen para el auditor, la web, el archivo, el puesto de recepción y el atacante: cada una hace su papel según ROL
# (ver arranque.sh). El SIEM es la imagen oficial de Wazuh (Dockerfile.siem).
FROM debian:trixie-slim
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      iproute2 iputils-ping curl nmap ncat netcat-openbsd procps less nano vim-tiny jq file \
      openssh-server openssh-client sshpass rsyslog cron nginx-light vsftpd ftp lftp redis-server redis-tools \
      hydra whatweb yara suricata \
    && rm -rf /var/lib/apt/lists/* && rm -f /etc/nginx/sites-enabled/default
# Los scripts de las máquinas (arranque, el ataque de la UD8 y la huella que usa el comprobador) van empaquetados en
# maquinas.b64: así no están a la vista las respuestas de la auditoría ni lo que hace el atacante
COPY maquinas.b64 /tmp/maquinas.b64
RUN base64 -d /tmp/maquinas.b64 | tar -xz -C /usr/local/bin && rm /tmp/maquinas.b64 \
 && chmod +x /usr/local/bin/arranque.sh /usr/local/bin/incidente.sh /usr/local/bin/huella.sh
COPY diccionario.txt /usr/share/lab/diccionario.txt
CMD ["/usr/local/bin/arranque.sh"]
