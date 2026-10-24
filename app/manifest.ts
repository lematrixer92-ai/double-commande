import type { MetadataRoute } from "next";

// Le manifeste dit au téléphone comment afficher l'appli une fois installée.
// L'installation complète et les notifications arrivent à l'étape 7.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Double Commande",
    short_name: "Double Commande",
    description: "La flotte de l'auto-école, sans oubli",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F7FA",
    theme_color: "#14213D",
    icons: [
      { src: "/icons/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
