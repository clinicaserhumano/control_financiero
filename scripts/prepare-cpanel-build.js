// Arma la carpeta .next/standalone con todo lo necesario para subir a cPanel:
// Next.js no copia public/ ni .next/static automaticamente en modo standalone.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error('No existe .next/standalone -- corre primero "npm run build:cpanel".');
  process.exit(1);
}

fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
fs.cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });

console.log("Listo: .next/standalone/ ya tiene public/ y .next/static/ copiados.");
console.log("Sube el CONTENIDO de esa carpeta a cPanel (no la carpeta en si).");
