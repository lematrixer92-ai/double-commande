// Le logo Double Commande : deux pédales côte à côte.
// Les couleurs viennent des variables de globals.css, pour que le logo
// reste visible en mode clair comme en mode sombre.
type LogoProps = {
  taille?: number;
};

export default function Logo({ taille = 96 }: LogoProps) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Logo Double Commande"
    >
      <rect x="18" y="22" width="38" height="76" rx="13" fill="var(--logo-pedale-gauche)" />
      <rect x="64" y="22" width="38" height="76" rx="13" fill="var(--orange)" />
      <path
        d="M28 44h18M28 56h18M28 68h18"
        stroke="var(--logo-traits-gauche)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M74 44h18M74 56h18M74 68h18"
        stroke="var(--bleu-marine)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
