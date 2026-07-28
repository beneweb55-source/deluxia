import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/app/(boutique)/inscription/RegisterForm';
import { getCurrentUser } from '@/app/(boutique)/_actions/auth';
import { AuthLayout } from '@/components/account/AuthLayout';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte DELUXIA pour retrouver vos commandes et gagner du temps.',
  robots: { index: false, follow: true },
};

export default async function InscriptionPage() {
  // Déjà connectée ? L'inscription n'a pas de sens : on renvoie vers l'espace.
  const current = await getCurrentUser();
  if (current) {
    redirect(current.role === 'ADMIN' ? '/admin' : '/mon-compte');
  }

  return (
    <AuthLayout
      title="Créer un compte"
      intro="Vos coordonnées sont enregistrées une fois, puis pré-remplies à chaque commande. Vous gardez l'historique de vos achats."
      aside={
        <>
          <h2 className="eyebrow text-ink">Déjà cliente ?</h2>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-graphite">
            Si vous avez déjà commandé sans compte, inscrivez-vous avec le même numéro de téléphone :
            vos commandes passées seront automatiquement rattachées.
          </p>

          <ButtonLink href="/connexion" variant="outline" size="md" fullWidth className="mt-7">
            J&rsquo;ai déjà un compte
          </ButtonLink>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
