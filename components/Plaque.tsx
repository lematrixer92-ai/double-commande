// Une plaque d'immatriculation française : bande bleue avec les étoiles
// européennes et le « F » à gauche, bande bleue à droite.
export default function Plaque({ numero }: { numero: string }) {
  const etoiles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6;
    return { x: 10 + 6.5 * Math.cos(angle), y: 10 + 6.5 * Math.sin(angle) };
  });

  return (
    <span className="plaque" aria-label={`Immatriculation ${numero}`}>
      <span className="plaque-bande" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="14" height="14">
          {etoiles.map((e, i) => (
            <circle key={i} cx={e.x} cy={e.y} r="1.4" fill="var(--plaque-etoiles)" />
          ))}
        </svg>
        F
      </span>
      <span className="plaque-numero">{numero}</span>
      <span className="plaque-bande" aria-hidden="true" />
    </span>
  );
}
