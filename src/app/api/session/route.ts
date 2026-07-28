import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSessionCustomer } from '@/lib/customerAuth';

/**
 * État de session, source d'autorité pour l'en-tête de la boutique.
 *
 * L'en-tête affiche d'abord un état instantané lu du cookie « indice »
 * (`deluxia_profile`), mais cet indice peut être absent ou périmé — typiquement
 * une session d'administration ouverte alors que l'indice n'avait pas été posé,
 * ou effacé par un navigateur agressif. Cette route relit la **vraie** session
 * (admin puis cliente) et fait foi : c'est elle qui corrige l'affichage.
 *
 * Coût maîtrisé : pour une visiteuse anonyme (aucun cookie de session), les deux
 * lectures retournent `null` sans jamais toucher la base. Seule une personne
 * réellement connectée déclenche une requête.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getSessionUser();
  if (admin) {
    return NextResponse.json({ user: { role: 'ADMIN', name: admin.name } });
  }

  const customer = await getSessionCustomer();
  if (customer) {
    return NextResponse.json({ user: { role: 'CUSTOMER', name: customer.firstName } });
  }

  return NextResponse.json({ user: null });
}
