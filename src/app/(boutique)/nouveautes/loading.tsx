/**
 * Squelette de chargement.
 *
 * Volontairement sobre : des blocs gris à la place du contenu, sans texte ni
 * animation vive. Un indicateur trop présent attire l'œil sur l'attente au lieu
 * de la faire oublier.
 */
export default function Loading() {
  return (
    <div className="shell py-16" aria-hidden="true">
      <div className="h-3 w-24 animate-shimmer bg-mist" />
      <div className="mt-6 h-10 w-full max-w-md animate-shimmer bg-mist" />

      <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index}>
            <div className="aspect-4/5 w-full animate-shimmer bg-mist" />
            <div className="mt-4 h-2.5 w-1/3 animate-shimmer bg-mist" />
            <div className="mt-2.5 h-3 w-3/4 animate-shimmer bg-mist" />
            <div className="mt-2.5 h-3 w-1/4 animate-shimmer bg-mist" />
          </div>
        ))}
      </div>

      <span className="sr-only" role="status">
        Chargement en cours
      </span>
    </div>
  );
}
