# Informe de auditoría · Clínica dental Sonríe

**Autorización:** auditoría encargada por la directora de la Clínica dental Sonríe el 07/12/2026 (👀 sin esto, no se toca nada).
**Alcance:** red interna 10.40.0.0/24, solo las máquinas de la clínica. Sin ataques que tiren servicios ni cambios en ellas.
**Auditor/a:** ✍️ tu nombre

## Resumen para la dirección

✍️ A7 · Tres o cuatro líneas, sin palabras técnicas: qué has encontrado, qué es lo más urgente y por qué.

## Pruebas

Copia en cada línea, detrás de los dos puntos, lo que has encontrado (es la prueba de que lo has visto de verdad).

- A3 · Fichero con datos de pacientes que se ve en la web: 
- A3 · Contraseña que aparece en /.git/config: 
- A4 · Contraseña del router que hay en el FTP anónimo: 
- A5 · Contraseña del usuario higienista en el archivo: 
- A6 · Versión del servicio que contesta sin contraseña: 

## Hallazgos

A7 · Uno por fila (H2…H6): qué es, la nota CVSS (0.0 a 10.0) y la gravedad que le corresponde a esa nota
(Crítica 9.0–10.0 · Alta 7.0–8.9 · Media 4.0–6.9 · Baja 0.1–3.9). Ordénalos de más grave a menos.

| ID | Máquina | Qué has encontrado | CVSS | Gravedad |
|---|---|---|---|---|
| H1 | 10.40.0.10 | 👀 Nginx dice su versión en la cabecera Server: el atacante sabe qué fallos buscar | 5.3 | Media |
| H2 | | | | |
| H3 | | | | |
| H4 | | | | |
| H5 | | | | |
| H6 | | | | |

## Recomendaciones

A7 · Una línea por hallazgo, empezando por su ID: qué hay que cambiar.

- H1: 👀 `server_tokens off;` en Nginx (UD6).
