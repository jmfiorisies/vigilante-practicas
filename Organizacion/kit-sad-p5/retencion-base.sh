#!/bin/bash
# Se ejecuta al construir la imagen: un repositorio con 120 copias diarias (del 3/10/2026 al 31/1/2027, a las 2:30)
# para que el comprobador pruebe la política de retención sin esperar 120 días.
set -e
export RESTIC_PASSWORD=prueba-retencion
R=/var/lib/lab/ret-base; mkdir -p /var/lib/lab/d; echo x > /var/lib/lab/d/f
restic -r $R init -q
for i in $(seq 119 -1 0); do
  restic -r $R backup /var/lib/lab/d -q --host taquilla --time "$(date -d "2027-01-31 -$i days" +%F) 02:30:00"
done
