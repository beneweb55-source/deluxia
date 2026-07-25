import type { Metadata } from 'next';
import { LoginForm } from '@/app/(boutique)/connexion/LoginForm';
import { AuthLayout } from '@/components/account/AuthLayout';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre compte DELUXIA pour retrouver vos commandes.',
  robots: { index: false, follow: true },
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.suite) ? params.suite[0] : params.suite;

  // Seul un chemin interne est retenu : un `//` initial désignerait un autre
  // domaine et transformerait la page en tremplin de redirection.
  const suite = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : undefined;

  return (
    <AuthLayout
      title="Connexion"
      intro="Retrouvez vos commandes, vos adresses et vos favoris. La gérante se connecte avec la même page."
      aside={
        <>
          <h2 className="eyebrow text-ink">Pas de compte ?</h2>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-graphite">
            Le compte est facultatif. Vous pouvez commander sans inscription, et suivre votre colis
            avec votre numéro de téléphone et la référence reçue.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <ButtonLink href="/inscription" size="md" fullWidth>
              Créer un compte
            </ButtonLink>
            <ButtonLink href="/mes-commandes" variant="outline" size="md" fullWidth>
              Suivre sans compte
            </ButtonLink>
          </div>
        </>
      }
    >
      <LoginForm suite={suite} />
    </AuthLayout>
  );
}
