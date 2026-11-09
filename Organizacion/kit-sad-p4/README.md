# Clínica dental Sonríe · Práctica 4 de SAD (auditoría, forense, malware y SIEM)

Todo funciona con **Docker** y con **un solo mando**: `./lab.sh`. No hace falta saber Docker.

```bash
./lab.sh arrancar      # la primera vez tarda unos minutos (el SIEM, Wazuh, pesa 1,3 GB)
./lab.sh ayuda         # todas las órdenes
./lab.sh comprobar     # qué está bien y qué falta
./lab.sh entregar      # guarda el informe; luego git add, commit y push a tu repositorio
```

| Carpeta / fichero | Qué es | Bloque |
|---|---|---|
| `informe/` | La auditoría: `hosts.txt`, `inventario.txt` y `hallazgos.md` (el informe) | A |
| `forense/` | Las evidencias del incidente: lo volátil, las copias y sus hashes, la cadena de custodia, la línea temporal y tus reglas YARA | B |
| `siem/reglas/local_rules.xml` | Tus reglas del SIEM (Wazuh) | B |
| `respuestas.md` | Tus respuestas a las preguntas de cada bloque | A y B |

**Descomprime el kit dentro de tu repositorio** (queda la carpeta `kit-sad-p4/`): se entrega con `git push`.

- **Solo se audita lo que está autorizado** (la cabecera de `informe/hallazgos.md`). Fuera de este laboratorio, sin
  permiso por escrito, lo del bloque A es delito (artículo 197 bis del Código Penal).
- El ataque del bloque B (`./lab.sh incidente`) se lanza **una vez**. Para repetirlo desde cero: `./lab.sh reiniciar`
  (tus ficheros de `informe/`, `forense/` y `siem/` se quedan).
- Si tienes arrancado el laboratorio de la UD7-8 (`docker-sad-ud78`), páralo antes (`./lab.sh parar`): los dos llevan
  un SIEM y juntos ocupan mucha memoria.

El enunciado completo está en la web de la asignatura (🏋️ Practicar), con la contraseña del curso.
