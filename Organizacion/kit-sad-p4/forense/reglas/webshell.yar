// B5 · Una regla YARA que encuentre LAS DOS webshells que dejó el atacante en la web
//      y que NO salte con cita.php (un PHP normal de la clínica) ni con nada más.
// Pruébala:  ./lab.sh yara
rule Webshell_clinica
{
    meta:
        descripcion = "✍️"
    strings:
        $php = "<?php"
        // ✍️
    condition:
        $php    // ✍️
}
