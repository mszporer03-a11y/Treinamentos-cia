// Copia o worker do pdf.js para /public, para ser servido em /pdf.worker.min.js
// (usado na miniatura da 1ª página e no visualizador de PDF).
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.js");
const dest = path.join(__dirname, "..", "public", "pdf.worker.min.js");

try {
  fs.copyFileSync(src, dest);
  console.log("pdf.worker.min.js copiado para /public");
} catch (e) {
  console.warn("Aviso: não foi possível copiar o worker do pdf.js:", e.message);
}
