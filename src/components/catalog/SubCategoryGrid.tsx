import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ProductVisual } from '@/components/ProductVisual';

export function SubCategoryGrid({
  categories,
  collectionSlug,
}: {
  categories: { name: string; slug: string; imageUrl: string | null }[];
  collectionSlug: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="shell pb-10">
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
        {categories.map((category, index) => (
          <li
            key={category.slug}
            className="reveal"
            style={{ '--reveal-delay': `${index * 110}ms` } as CSSProperties}
          >
            <Link href={`/c/${collectionSlug}?categorie=${category.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden bg-mist rounded-xl">
                <div className="absolute inset-0 transition-transform duration-[1400ms] [transition-timing-function:var(--ease-luxe)] group-hover:scale-[1.05]">
                  <ProductVisual
                    name={category.name}
                    slug={`category-${category.slug}`}
                    images={category.imageUrl ? [category.imageUrl] : undefined}
                    kind="abstract"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>

                {/* Voile bas pour garantir le contraste du titre */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-paper/90 via-paper/50 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                  <h3 className="text-[1.125rem] font-medium leading-none tracking-[-0.01em] text-ink">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
