# Práctica 5 de SAD · La Taquilla (bloque A: proxy y balanceo · B: alta disponibilidad · C: copias y continuidad)
# Una sola imagen para todas las máquinas: cada una hace su papel según ROL (ver arranque.sh).
FROM debian:trixie-slim
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      iproute2 iputils-ping curl ca-certificates procps less nano vim-tiny jq nftables socat psmisc cron \
      squid apache2-utils goaccess haproxy keepalived nginx-light \
      restic restic-rest-server python3 python3-yaml \
    && rm -rf /var/lib/apt/lists/* && rm -f /etc/nginx/sites-enabled/default
# Los scripts de las máquinas van empaquetados en maquinas.b64: así no están a la vista lo que comprueba cada uno
COPY maquinas.b64 /tmp/maquinas.b64
RUN base64 -d /tmp/maquinas.b64 | tar -xz -C /usr/local/bin && rm /tmp/maquinas.b64 \
 && chmod +x /usr/local/bin/*.sh /usr/local/bin/*.py && /usr/local/bin/retencion-base.sh
CMD ["/usr/local/bin/arranque.sh"]
