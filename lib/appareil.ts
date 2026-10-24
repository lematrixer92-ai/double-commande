/*
  Ce que le téléphone ou l'ordinateur sait faire (côté navigateur seulement).
*/

// iPhone ou iPad (les iPad récents se présentent comme un Mac tactile).
export function estIphone(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Vrai si l'appli est ouverte depuis l'icône de l'écran d'accueil.
export function estInstallee(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function notificationsPossibles(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// La clé publique (texte « base64url ») au format attendu par le navigateur.
export function cleEnOctets(cle: string): Uint8Array<ArrayBuffer> {
  const base64 = (cle + "=".repeat((4 - (cle.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const brut = atob(base64);
  const octets = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i);
  return octets;
}

export function octetsEnTexte(octets: Uint8Array): string {
  let brut = "";
  for (const o of octets) brut += String.fromCharCode(o);
  return btoa(brut).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// L'invitation « Installer l'appli » de Chrome / Edge / Android,
// gardée de côté dès qu'elle arrive (voir EnregistrementAppli).
export type InvitationInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const EVENEMENT_INSTALLATION = "double-commande-installation";

export function invitationInstallation(): InvitationInstallation | null {
  return (window as Window & { __installation?: InvitationInstallation }).__installation ?? null;
}
