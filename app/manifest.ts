import type { MetadataRoute } from "next";

// Le manifeste dit au téléphone comment afficher l'appli une fois installée.
// Avec le service worker (public/sw.js), il permet d'installer l'appli
// sur l'écran d'accueil et de recevoir les notifications.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Double Commande",
    short_name: "Double Commande",
    description: "La flotte de l'auto-école, sans oubli",
    lang: "fr",
    id: "/",
    start_url: "/accueil",
    scope: "/",
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
