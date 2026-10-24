/*
  Le « service worker » de Double Commande.
  Il tourne en arrière-plan dans le téléphone, même appli fermée :
  - il affiche les notifications envoyées par le site ;
  - quand on appuie sur une notification, il ouvre la bonne page.
*/

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let donnees = {};
  try {
    donnees = event.data ? event.data.json() : {};
  } catch {
    donnees = { texte: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(donnees.titre || "Double Commande", {
      body: donnees.texte || "",
      icon: "/icons/icone-192.png",
      badge: "/icons/icone-192.png",
      tag: donnees.tag,
      renotify: Boolean(donnees.tag),
      data: { url: donnees.url || "/accueil" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/accueil", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // L'appli est déjà ouverte : on la ramène devant, sur la bonne page.
      for (const fenetre of fenetres) {
        if (new URL(fenetre.url).origin === self.location.origin && "focus" in fenetre) {
          await fenetre.focus();
          try {
            await fenetre.navigate(url);
          } catch {
            // (page pas encore suivie par le service worker : elle reste devant)
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
