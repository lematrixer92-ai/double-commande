/*
  À mettre dans une page pour qu'elle s'élargisse sur un ordinateur
  (le secrétariat y travaille surtout). Sur téléphone, rien ne change.
  Ne s'affiche pas : la mise en page est dans globals.css.
*/
export default function PageLarge({ taille = "large" }: { taille?: "large" | "moyenne" }) {
  return <span className={`page-${taille}`} hidden />;
}
