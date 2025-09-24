#!/usr/bin/env node
/**
 * split-atom.js
 * Uso:
 *   node split-atom.js ruta/al/feed.xml [directorio_salida]
 *
 * Ejemplo:
 *   node split-atom.js ./feed.xml ./versions
 *
 * Comportamiento:
 *   - Extrae todas las <entry>…</entry> en el orden del documento.
 *   - Guarda en orden inverso: última entry -> version1.atom, penúltima -> version2.atom, etc.
 *   - Cada archivo incluye prolog XML y el bloque <entry> original (sin modificar).
 */

import fs from "fs/promises";
import path from "path";

async function main() {
  const [, , inputPath, outDirArg] = process.argv;

  if (!inputPath) {
    console.error("Uso: node split-atom.js ruta/al/feed.xml [directorio_salida]");
    process.exit(1);
  }

  const outDir = outDirArg || path.join(process.cwd(), "versions");

  // Lee el feed completo como texto (UTF-8 por defecto)
  const xml = await fs.readFile(inputPath, "utf8");

  // Captura segura (no codiciosa) de bloques <entry>…</entry> (namespaces no afectan)
  const entryRegex = /<entry\b[^>]*>[\s\S]*?<\/entry>/gi;
  const entries = [];
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    entries.push(match[0]);
  }

  if (entries.length === 0) {
    console.error("No se encontraron <entry> en el XML.");
    process.exit(2);
  }

  // Crea el directorio de salida si no existe
  await fs.mkdir(outDir, { recursive: true });

  // Invierte y escribe
  const reversed = entries.slice().reverse();
  const prolog = '<?xml version="1.0" encoding="UTF-8"?>\n';

  await Promise.all(
    reversed.map((entry, i) => {
      const filename = `version${i + 1}.atom`;
      const outPath = path.join(outDir, filename);
      return fs.writeFile(outPath, prolog + entry, "utf8");
    })
  );

  console.log(
    `Listo. Se escribieron ${reversed.length} archivos en: ${outDir}\n` +
    `Ejemplo: ${path.join(outDir, "version1.atom")}`
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(99);
});
