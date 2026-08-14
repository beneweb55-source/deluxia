'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PIXEL_CURRENCY, trackPixel } from '@/lib/pixel';

/**
 * Panier — état conservé côté navigateur et persisté dans localStorage.
 *
 * Aucun compte n'est requis pour commander : le panier vit dans le navigateur
 * du visiteur, ce qui supprime toute friction d'inscription. Les prix sont
 * systématiquement revalidés côté serveur à la création de la commande, si bien
 * qu'une altération du localStorage ne peut pas modifier le montant facturé.
 */

const STORAGE_KEY = 'deluxia.cart.v1';
/** Garde-fou : au-delà, c'est une erreur de saisie ou un robot. */
const MAX_QUANTITY_PER_LINE = 20;

export interface CartLine {
  /** Identifiant de ligne : un même produit en deux tailles fait deux lignes. */
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
  categorySlug: string | null;
  /** Stock disponible au moment de l'ajout — borne l'incrémentation. */
  stock: number;
}

export type CartAddition = Omit<CartLine, 'key' | 'quantity'> & { quantity?: number };

interface CartContextValue {
  lines: readonly CartLine[];
  /** Nombre total d'articles (somme des quantités). */
  count: number;
  subtotal: number;
  /** Faux tant que le localStorage n'a pas été relu : évite tout écart d'hydratation. */
  ready: boolean;
  isOpen: boolean;
  add: (item: CartAddition) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, size: string, color: string): string {
  return `${productId}::${size}::${color}`;
}

/** Relit et assainit le panier stocké : un localStorage corrompu ne doit rien casser. */
function readStored(): CartLine[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((line): line is CartLine => {
      if (typeof line !== 'object' || line === null) return false;
      const l = line as Record<string, unknown>;
      return (
        typeof l.key === 'string' &&
        typeof l.productId === 'string' &&
        typeof l.variantId === 'string' &&
        typeof l.slug === 'string' &&
        typeof l.name === 'string' &&
        typeof l.size === 'string' &&
        typeof l.color === 'string' &&
        typeof l.unitPrice === 'number' &&
        Number.isFinite(l.unitPrice) &&
        l.unitPrice > 0 &&
        typeof l.quantity === 'number' &&
        l.quantity > 0 &&
        typeof l.stock === 'number' &&
        l.stock >= 0
      );
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Miroir synchrone du panier : permet à `add` de connaître la quantité déjà
  // présente sur une ligne pour calculer l'ajout réel (après plafonnement stock)
  // sans dépendre du timing d'un setState.
  const linesRef = useRef<CartLine[]>([]);

  // Hydratation depuis le stockage local, après le premier rendu.
  useEffect(() => {
    setLines(readStored());
    setReady(true);
  }, []);

  // Persistance — seulement après hydratation, pour ne pas écraser
  // le panier existant avec le tableau vide du premier rendu.
  useEffect(() => {
    linesRef.current = lines;
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Quota dépassé ou navigation privée : le panier reste utilisable en mémoire.
    }
  }, [lines, ready]);

  // Synchronise les onglets ouverts sur la même boutique.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLines(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((item: CartAddition) => {
    const key = lineKey(item.productId, item.size, item.color);
    const wanted = Math.max(1, item.quantity ?? 1);

    // Quantité RÉELLEMENT ajoutée, une fois le plafond de stock appliqué. Calculée
    // à partir du panier courant (linesRef) en reproduisant exactement la logique
    // de plafonnement ci-dessous : une ligne déjà au maximum ajoute 0.
    const existingNow = linesRef.current.find((line) => line.key === key);
    const cap = Math.min(
      item.stock || existingNow?.stock || MAX_QUANTITY_PER_LINE,
      MAX_QUANTITY_PER_LINE,
    );
    const before = existingNow?.quantity ?? 0;
    const added = Math.min(before + wanted, cap) - before;

    setLines((current) => {
      const existing = current.find((line) => line.key === key);

      if (!existing) {
        const ceiling = Math.min(item.stock || MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE);
        return [...current, { ...item, key, quantity: Math.min(wanted, ceiling) }];
      }

      // Le stock connu peut avoir changé depuis l'ajout initial : on retient le plus récent.
      const ceiling = Math.min(item.stock || existing.stock || MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE);
      return current.map((line) =>
        line.key === key
          ? {
              ...line,
              stock: item.stock,
              unitPrice: item.unitPrice,
              quantity: Math.min(line.quantity + wanted, ceiling),
            }
          : line,
      );
    });

    setIsOpen(true);

    // Point de passage unique de tous les ajouts au panier (carte produit,
    // fiche détaillée, ajout rapide) : l'événement Meta Pixel est donc émis ici
    // une seule fois pour toute l'application, avec la quantité réellement
    // ajoutée. No-op si le tracking est inactif ou si rien n'a pu être ajouté.
    if (added > 0) {
      trackPixel('AddToCart', {
        value: item.unitPrice * added,
        currency: PIXEL_CURRENCY,
        content_type: 'product',
        contents: [{ id: item.slug, quantity: added, item_price: item.unitPrice }],
      });
    }
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) return current.filter((line) => line.key !== key);

      return current.map((line) =>
        line.key === key
          ? {
              ...line,
              quantity: Math.min(
                quantity,
                Math.min(line.stock || MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE),
              ),
            }
          : line,
      );
    });
  }, []);

  const remove = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
    return { lines, count, subtotal, ready, isOpen, add, setQuantity, remove, clear, open, close };
  }, [lines, ready, isOpen, add, setQuantity, remove, clear, open, close]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart doit être utilisé à l\'intérieur de <CartProvider>.');
  return context;
}
