// Crée les icônes PNG de l'appli à partir de l'icône SVG.
// À lancer seulement si l'icône change : node scripts/generer-icones.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile("public/icons/icone-double-commande.svg");

for (const taille of [192, 512]) {
  await sharp(svg, { density: 300 }).resize(taille, taille).png()
    .toFile(`public/icons/icone-${taille}.png`);
}

// Icône « maskable » : Android peut la découper en rond, on garde donc
// les pédales au centre sur un fond plein.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#14213D"/>
<g transform="translate(136 136) scale(2)">
<rect x="18" y="22" width="38" height="76" rx="13" fill="#FFFFFF"/>
<rect x="64" y="22" width="38" height="76" rx="13" fill="#F5A524"/>
</g></svg>`;
await sharp(Buffer.from(maskable)).png().toFile("public/icons/icone-maskable-512.png");

// Icône pour l'écran d'accueil de l'iPhone (sans coins arrondis : iOS les ajoute).
const apple = maskable.replace('translate(136 136) scale(2)', 'translate(96 96) scale(2.6667)');
await sharp(Buffer.from(apple)).resize(180, 180).png().toFile("app/apple-icon.png");

console.log("Icônes créées.");
