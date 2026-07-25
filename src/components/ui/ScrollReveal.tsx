'use client';

import { useEffect } from 'react';

/**
 * Anime l'apparition de tous les éléments portant la classe `.reveal`.
 *
 * Un observateur unique est monté pour toute l'application plutôt qu'un
 * observateur par composant : les composants qui s'animent restent alors de
 * simples composants serveur (aucun JavaScript envoyé au navigateur pour eux),
 * ce qui est déterminant pour le score Lighthouse.
 *
 * Le MutationObserver prend en charge les éléments ajoutés après coup
 * (résultats de filtres, produits chargés à la demande…).
 */
export function ScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
        el.dataset.revealed = 'true';
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.revealed = 'true';
          io.unobserve(el); // une seule fois : pas de ré-animation au scroll inverse
        }
      },
      // Déclenche un peu avant l'entrée réelle dans le viewport : l'élément
      // est déjà en place quand l'œil l'atteint.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );

    const observe = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>('.reveal:not([data-revealed])').forEach((el) => {
        io.observe(el);
      });
    };

    observe(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as HTMLElement;
          if (el.classList.contains('reveal') && !el.dataset.revealed) io.observe(el);
          observe(el);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
