import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'Administration', template: '%s · Administration DELUXIA' },
  // L'administration ne doit jamais apparaître dans un moteur de recherche.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Enveloppe commune à l'administration.
 *
 * Volontairement vide de tout habillage : la page de connexion doit s'afficher
 * seule, tandis que les pages authentifiées reçoivent leur barre latérale du
 * layout du groupe `(panel)`.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
