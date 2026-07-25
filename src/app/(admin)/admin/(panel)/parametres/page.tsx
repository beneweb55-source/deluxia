import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PasswordForm, ProfileForm, StoreSettingsForm } from '@/components/admin/SettingsForms';
import { AdminPageHeader, Card } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/auth';
import { BRAND, SOCIALS } from '@/lib/brand';
import { formatNumber } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Paramètres' };

/** Ligne d'une fiche en lecture seule. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-3 last:border-b-0">
      <dt className="text-[0.75rem] tracking-[0.08em] text-graphite uppercase">{label}</dt>
      <dd className="text-[0.875rem] text-ink">{children}</dd>
    </div>
  );
}

export default async function ParametresPage() {
  const admin = await requireAdmin();

  const [setting, products, orders, customers] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'announcement' } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.customer.count(),
  ]);

  // La colonne est un Json libre : tout ce qui n'est pas une chaîne est ignoré
  // plutôt que rendu tel quel, pour ne jamais afficher « [object Object] ».
  const announcement = typeof setting?.value === 'string' ? setting.value : '';

  return (
    <>
      <AdminPageHeader
        title="Paramètres"
        description="Votre compte, votre mot de passe et les réglages de la boutique."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Votre compte">
          <ProfileForm name={admin.name} email={admin.email} />
        </Card>

        <Card title="Mot de passe">
          <PasswordForm />
        </Card>

        <Card title="Boutique">
          <StoreSettingsForm announcement={announcement} />
        </Card>

        <Card title="Coordonnées publiques">
          <dl>
            <Row label="Téléphone">
              <a href={`tel:${BRAND.phoneE164}`} className="link-underline">
                {BRAND.phoneDisplay}
              </a>
            </Row>
            <Row label="E-mail">
              <a href={`mailto:${BRAND.email}`} className="link-underline">
                {BRAND.email}
              </a>
            </Row>
            <Row label="Ville">{`${BRAND.city}, ${BRAND.country}`}</Row>
            {SOCIALS.map((social) => (
              <Row key={social.label} label={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-underline"
                >
                  {social.handle}
                </a>
              </Row>
            ))}
          </dl>


        </Card>

        <Card title="Informations techniques" className="lg:col-span-2">
          <dl>
            <Row label="Produits">{formatNumber(products)}</Row>
            <Row label="Commandes">{formatNumber(orders)}</Row>
            <Row label="Clients">{formatNumber(customers)}</Row>
          </dl>


        </Card>
      </div>
    </>
  );
}
