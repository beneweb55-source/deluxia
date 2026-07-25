/**
 * Insère un bloc de données structurées schema.org.
 * Le contenu provient exclusivement de notre base : aucune entrée utilisateur
 * n'est sérialisée ici, et `JSON.stringify` échappe déjà les caractères de contrôle.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
