'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackPixel } from '@/lib/pixel';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Meta Pixel — script de base + suivi des changements de page.
 *
 * Rien n'est chargé tant que `NEXT_PUBLIC_META_PIXEL_ID` n'est pas renseigné : le
 * composant est inerte en développement et le restera jusqu'à ce que la cliente
 * colle son identifiant de Pixel dans les variables d'environnement (Vercel →
 * Settings → Environment Variables). Aucune donnée n'est transmise à Meta avant
 * cela — l'emplacement est prêt, l'interrupteur reste éteint.
 *
 * Les événements métier (AddToCart, InitiateCheckout, Purchase) sont émis
 * ailleurs, au plus près de l'action, via `trackPixel` (voir `@/lib/pixel`).
 */
export function MetaPixel() {
  const pathname = usePathname();
  const firstLoad = useRef(true);

  // Le script de base déclenche déjà un PageView au chargement initial : on ne
  // ré-émet donc qu'aux navigations suivantes. Next.js ne recharge pas la page
  // d'un clic à l'autre, sans quoi Meta ne compterait que la première vue.
  useEffect(() => {
    if (!PIXEL_ID) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    trackPixel('PageView');
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <>
      {/* `afterInteractive` et non `lazyOnload` : ce dernier s'accroche à
          l'événement `load` de la page. Or celui-ci est souvent déjà passé au
          moment où le composant s'enregistre (navigation côté client, hydratation
          tardive) — le script n'était alors jamais injecté et AUCUN événement ne
          partait. Pour un pixel publicitaire, un événement manqué fausse
          l'attribution et gâche du budget : la fiabilité prime sur les quelques
          millisecondes gagnées. C'est aussi la stratégie recommandée par Next.js
          pour les scripts de mesure. */}
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');`}
      </Script>

      {/* Repli sans JavaScript — image de suivi 1×1. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
