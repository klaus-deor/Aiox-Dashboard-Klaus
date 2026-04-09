/**
 * Next.js standalone output does NOT include .next/static or public/.
 * They must be copied manually for the standalone server to serve them.
 * See: https://nextjs.org/docs/app/api-reference/config/next-config-js/output#automatically-copying-traced-files
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.log("[copy-static] No standalone dir found, skipping.");
  process.exit(0);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy .next/static -> .next/standalone/.next/static
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
console.log("[copy-static] Copying .next/static ...");
copyDir(staticSrc, staticDest);

// Copy public -> .next/standalone/public
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");
console.log("[copy-static] Copying public ...");
copyDir(publicSrc, publicDest);

console.log("[copy-static] Done.");
