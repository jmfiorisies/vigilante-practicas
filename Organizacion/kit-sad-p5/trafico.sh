#!/bin/bash
# Una mañana en la taquilla: el personal (marta y jon) navega por el proxy, con su usuario.
# Cada vez sale distinto: el informe de GoAccess es el que dice quién y qué.
P="-x 10.70.0.2:3128"
URLS=(http://proveedor.test/ http://proveedor.test/pedido-1.html http://proveedor.test/pedido-2.html http://proveedor.test/pedido-3.html
      http://proveedor.test/catalogo.pdf http://cartelera.test/ http://cartelera.test/concierto-1.html
      http://reventa.test/ http://apuestas.test/ http://proveedor.test/promo.mp4)
favorita=$(( RANDOM % 7 ))                      # una de las páginas permitidas se visita mucho más
quien=$(( RANDOM % 2 ))                         # y una de las dos personas navega mucho más que la otra
n=0
for i in "${!URLS[@]}"; do
  veces=$(( 2 + RANDOM % 5 )); [ "$i" -eq "$favorita" ] && veces=$(( 20 + RANDOM % 8 ))
  for k in $(seq "$veces"); do
    r=$(( (k + i) % 4 ))
    if { [ "$r" -ne 0 ] && [ "$quien" = 0 ]; } || { [ "$r" -eq 0 ] && [ "$quien" = 1 ]; }; then U=marta:Taquilla-Marta-26; else U=jon:Taquilla-Jon-26; fi
    curl -s -o /dev/null --max-time 5 $P -U "$U" "${URLS[$i]}"; n=$((n + 1))
  done
done
echo "$n peticiones"
