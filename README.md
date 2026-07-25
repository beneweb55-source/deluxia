# DELUXIA — boutique en ligne

Chaussures et sacs pour femme, livrés partout en Algérie, payés à la réception.

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · Prisma · PostgreSQL (Neon)

---

## Démarrer

```bash
npm install
cp .env.example .env      # puis renseigner DATABASE_URL, AUTH_SECRET, ADMIN_*
npm run db:push           # crée les tables
npm run db:seed           # catégories, produits, tarifs, compte administrateur
npm run dev               # http://localhost:3100
```

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run start` | serveur de production |
| `npm run typecheck` | vérification TypeScript |
| `npm run db:push` | applique le schéma Prisma à la base |
| `npm run db:seed` | jeu de données initial (idempotent) |
| `npm run db:studio` | explorateur de base Prisma |
| `npx tsx scripts/dev-orders.ts` | commandes de démonstration (développement seulement) |

### Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | chaîne PostgreSQL |
| `AUTH_SECRET` | clé de signature des sessions — `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NEXT_PUBLIC_SITE_URL` | URL publique, utilisée par le sitemap et les métadonnées |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | compte créé par le seed, **à changer après la première connexion** |

---

## Administration

`/admin`, accessible depuis `/connexion` avec le compte du seed.

| Rubrique | Ce qu'on y fait |
| --- | --- |
| Tableau de bord | chiffre d'affaires, commandes du jour, meilleures ventes, stock faible |
| Commandes | confirmation en un clic, actions groupées, changement de statut, impression |
| Produits | prix et stock modifiables dans le tableau, duplication, visibilité, photos |
| Catégories | création et rangement dans les trois univers |
| Clients | historique, panier moyen, clientes fidèles |
| Livraison | grille des 58 wilayas, ajustement groupé, restauration |
| Messages | formulaire de contact |
| Paramètres | profil, mot de passe, annonce du bandeau |

### Gestes prévus pour être répétés

Le tableau des commandes est conçu pour le traitement du matin :

- **✓ Confirmer** apparaît sur les commandes en attente — un clic, sans ouvrir la fiche ;
- **→ Étape suivante** fait avancer la commande dans le circuit ;
- **cases à cocher + barre d'actions groupées** pour traiter une dizaine de commandes ensemble ;
- **annuler** remet automatiquement les articles en stock et corrige le total dépensé de la cliente.

Sur les produits, le prix se modifie en cliquant dessus, le stock avec les boutons `−` / `+`
(appliqués à toutes les déclinaisons, ce qui correspond à un réassort).

### Photos produits

Le bouton « Ajouter des photos » ouvre l'explorateur du système sur ordinateur, la galerie
ou l'appareil photo sur téléphone. Chaque image est **redimensionnée à 1600 px et convertie
en WebP par le navigateur avant l'envoi** : une photo de 4 Mo devient un fichier de 150 à
300 Ko.

Les fichiers sont stockés dans la table `media_assets` et servis par `/api/media/[id]` avec
un cache d'un an. Ce choix évite d'imposer un compte de stockage tiers, et surtout de perdre
les photos à chaque déploiement — l'hébergement d'une application Next.js est en lecture seule.

Sans photo, la boutique compose un visuel monochrome à partir du nom du produit. Le produit
reste vendable ; il suffit d'ajouter les photos plus tard.

---

## Livraison

La grille provient des tarifs ZR Express fournis par le client.

- `src/data/wilayas.ts` — référentiel : noms, communes, grille d'origine. **Ne fixe pas les
  tarifs appliqués.** Sert au seed, au repli, et aux listes de communes.
- Table `delivery_rates` — **tarifs réellement appliqués**, modifiables dans l'administration.
- `src/lib/delivery-quote.ts` — calcul pur, exécuté à l'identique dans le navigateur (affichage
  instantané) et sur le serveur (montant enregistré). Les deux ne peuvent pas diverger.
- `src/lib/delivery-rates.ts` — lecture de la grille, avec repli sur le référentiel si la table
  est vide.

Trois règles métier, appliquées dans `quoteDelivery` et nulle part ailleurs :

1. un tarif bureau à **0 DA** signifie qu'aucun bureau n'existe : l'option est masquée côté
   cliente et la livraison bascule à domicile ;
2. une wilaya **non desservie** reste visible dans le formulaire, mais la commande y est refusée
   avec un message explicite plutôt que de disparaître sans explication ;
3. **Alger** est au même tarif à domicile qu'en bureau.

Quatre wilayas ne sont pas desservies : Illizi, Tindouf, Bordj Badji Mokhtar, Djanet.

---

## Sécurité

- Mots de passe hachés avec `scrypt` (`node:crypto`), jamais stockés en clair.
- Sessions : jeton aléatoire côté navigateur, **empreinte SHA-256 seule en base** — une fuite
  de la table des sessions ne permet pas d'usurper un compte.
- Le middleware ne vérifie que la présence du cookie ; l'autorisation réelle est contrôlée
  côté serveur (`requireAdmin`, `getSessionCustomer`) à chaque page protégée.
- Un second cookie, `deluxia_profile`, contient uniquement un rôle et un prénom pour
  l'affichage de l'en-tête. **Il n'accorde aucun droit** et n'est jamais utilisé pour autoriser
  quoi que ce soit.
- Aucun compte d'administration ne peut être créé depuis le site : la gérante est créée par
  le seed.
- **Les montants ne viennent jamais du navigateur** : prix, frais de livraison et total sont
  recalculés côté serveur à la création de la commande.
- Le stock est décrémenté dans la même transaction que la commande : deux clientes ne peuvent
  pas acheter la dernière paire simultanément.

---

## Structure

```
src/
  app/
    (boutique)/         boutique publique — en-tête, pied de page, panier
    (admin)/admin/      administration — barre latérale, aucun panier
      _actions/         Server Actions (catalogue, gestion)
    api/                routes JSON et service des visuels
  components/
    ui/                 primitives (Button, Field, Drawer, Accordion)
    admin/              tableaux, actions rapides, graphiques
    product/            galerie, panneau d'achat, guide des tailles
  lib/                  accès données, calculs, SEO, sécurité
  data/wilayas.ts       référentiel des 58 wilayas
```

Deux groupes de routes séparés : la boutique et l'administration ne partagent aucun habillage,
ce qui évite d'embarquer le panier dans l'admin et la navigation de gestion dans la boutique.

---

## Choix techniques notables

**Pas de bibliothèque d'animation, d'icônes ou de graphiques.** Tout est en CSS et SVG maison.
Le JavaScript partagé tient en 102 ko.

**Le contenu ne dépend jamais d'une animation.** Les apparitions passent par la classe `.enter`,
active seulement si `prefers-reduced-motion` le permet : si l'animation ne joue pas, le texte
s'affiche simplement sans transition. C'est un piège classique — un hero invisible parce qu'une
animation ne s'est pas terminée.

**Champs de formulaire à 16 px sur mobile.** En dessous, Safari iOS zoome à chaque mise au point
du champ. Sur un tunnel de commande rempli au pouce, c'est rédhibitoire.

**Reprise sur base injoignable.** Une base serverless se suspend après quelques minutes et met
une à trois secondes à se réveiller. `withRetry` rejoue les lectures en cas d'erreur de
connexion — sans cela, le premier build de la journée échoue alors que la base est saine.

---

## Prêt pour la suite

Le code est structuré pour recevoir sans refonte : paiement CIB / Edahabia / BaridiMob
(`PaymentType` existe déjà), codes promo (`discount` existe sur les commandes), avis clients,
programme de fidélité (`totalOrders` et `totalSpent` sont tenus à jour), envoi de la newsletter
(les adresses sont collectées), et les traceurs Meta / Google (variables prévues dans `.env`).
