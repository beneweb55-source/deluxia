import { Logo } from '@/components/Logo';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Page 404.
 *
 * Elle vit à la racine de `app/`, hors du groupe `(boutique)` : elle n'hérite
 * donc ni de l'en-tête ni du pied de page, et doit se suffire à elle-même. Le
 * logo sert de retour à l'accueil.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-20 text-center">
      <Logo size="md" />

      <p className="eyebrow mt-16">Erreur 404</p>

      <h1 className="mt-5 text-[clamp(1.75rem,6vw,3.5rem)] font-extralight leading-[1.05] tracking-[-0.035em] text-ink">
        Cette page n&rsquo;existe pas
      </h1>

      <span className="mt-10 block h-px w-16 bg-line" />

      <p className="mt-10 max-w-md text-[0.9375rem] leading-relaxed text-graphite">
        Le lien est peut-être ancien, ou l&rsquo;article a quitté la collection. Le reste de la
        boutique vous attend.
      </p>

      <div className="mt-11 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/boutique" size="lg">
          Voir la collection
        </ButtonLink>
        <ButtonLink href="/nouveautes" variant="outline" size="lg">
          Nouveautés
        </ButtonLink>
      </div>

      <ButtonLink href="/contact" variant="quiet" size="sm" className="mt-6">
        Besoin d&rsquo;aide ? Nous contacter
      </ButtonLink>
    </div>
  );
}
