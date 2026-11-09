# mutar.py fichero 'antes' 'después' [n-ésima aparición, desde 1] — cambia un trozo exacto (falla si no está)
import sys
p, a, b = sys.argv[1], sys.argv[2].replace("\\n", "\n"), sys.argv[3].replace("\\n", "\n")   # «\n» escrito = salto de línea
n = int(sys.argv[4]) if len(sys.argv) > 4 else 1
s = open(p).read()
assert s.count(a) >= n, f"no está: {a!r}"
i = -1
for _ in range(n): i = s.index(a, i + 1)
open(p, "w").write(s[:i] + b + s[i + len(a):])
