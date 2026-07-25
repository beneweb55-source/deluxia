import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Layout des pages authentifiées.
 *
 * `requireAdmin()` s'exécute ici, côté serveur, avant tout rendu : c'est le
 * contrôle qui fait autorité. Le middleware ne fait qu'éviter un aller-retour
 * inutile aux visiteurs manifestement non connectés.
 *
 * Les pastilles de la barre latérale (commandes en attente, messages non lus)
 * sont calculées à ce niveau : elles restent ainsi visibles et à jour sur toutes
 * les pages, sans être recalculées dans chacune d'elles.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  const [pendingOrders, unreadMessages] = await Promise.all([
    prisma.order.count({ where: { status: 'EN_ATTENTE' } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  return (
    <AdminShell user={user} badges={{ commandes: pendingOrders, messages: unreadMessages }}>
      {children}
    </AdminShell>
  );
}
