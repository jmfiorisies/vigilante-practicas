# La Taquilla · Práctica 5 de SAD (proxy, balanceo, alta disponibilidad, copias y continuidad)

Todo funciona con **Docker** y con **un solo mando**: `./lab.sh`. No hace falta saber Docker.

```bash
./lab.sh arrancar      # la primera vez tarda unos minutos (12 máquinas, una sola imagen)
./lab.sh ayuda         # todas las órdenes
./lab.sh comprobar     # qué está bien y qué falta (a, b o c para un solo bloque)
./lab.sh entregar      # guarda el informe; luego git add, commit y push a tu repositorio
```

| Carpeta / fichero | Qué es | Bloque |
|---|---|---|
| `squid/` | El proxy de la oficina (`squid.conf` y `usuarios`) | A |
| `haproxy/haproxy.cfg` | El balanceador de la tienda (el mismo en lb1 y lb2) | A |
| `informe/` | El informe de GoAccess, tus datos (`datos.md`) y los tiempos de failover | A y B |
| `keepalived/` | `lb1.conf` y `lb2.conf` | B |
| `backup/` | La copia (`copia.sh`, `clave`, `excluir.txt`, `crontab`) | C |
| `nube/opciones` | El servicio de copias fuera de la sede | C |
| `plan/` | El plan de continuidad, el registro de tratamiento y los riesgos | B y C |
| `respuestas.md` | Tus respuestas a las preguntas de cada bloque | A, B y C |

**Descomprime el kit dentro de tu repositorio** (queda la carpeta `kit-sad-p5/`): se entrega con `git push`.

- `./lab.sh desastre` (bloque C) se lanza **una vez por arranque**. Para repetirlo desde cero: `./lab.sh reiniciar`
  (borra el disco externo y la nube; tus ficheros se quedan).
- Si tienes arrancados los laboratorios de la UD9-10 o la UD11-12, páralos antes (`./lab.sh parar` en su carpeta).

El enunciado completo está en la web de la asignatura (🏋️ Practicar), con la contraseña del curso.
