import { formatNumber } from '@/lib/format';

/**
 * Graphiques du tableau de bord — SVG calculé côté serveur.
 *
 * Aucune bibliothèque de graphiques : celles du marché pèsent 40 à 150 ko et
 * imposent un rendu côté client. Ici, le HTML arrive déjà tracé, il s'imprime
 * correctement et il suit automatiquement le thème clair ou sombre.
 */

export interface SeriesPoint {
  label: string;
  value: number;
}

/** Courbe d'évolution avec aire remplie. */
export function TrendChart({
  data,
  height = 180,
  formatValue = (value: number) => formatNumber(value),
}: {
  data: SeriesPoint[];
  height?: number;
  formatValue?: (value: number) => string;
}) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-[0.875rem] text-ash">Aucune donnée à afficher.</p>;
  }

  const width = 600;
  const padding = { top: 12, right: 4, bottom: 24, left: 4 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Échelle : on part toujours de zéro pour ne pas exagérer visuellement les
  // variations, et on garde une borne haute non nulle même sans commande.
  const max = Math.max(...data.map((point) => point.value), 1);

  const x = (index: number) =>
    padding.left + (data.length === 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => padding.top + innerH - (value / max) * innerH;

  const line = data.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(point.value)}`).join(' ');
  const area = `${line} L${x(data.length - 1)},${padding.top + innerH} L${x(0)},${padding.top + innerH} Z`;

  const peak = data.reduce((best, point) => (point.value > best.value ? point : best), data[0]!);
  const peakIndex = data.indexOf(peak);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Évolution sur ${data.length} jours. Maximum : ${formatValue(peak.value)} le ${peak.label}.`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-ink)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lignes de repère */}
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * ratio}
            y2={padding.top + innerH * ratio}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="url(#trend-fill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {peak.value > 0 && (
          <circle cx={x(peakIndex)} cy={y(peak.value)} r="3.5" fill="var(--color-ink)" />
        )}
      </svg>

      <figcaption className="mt-2 flex justify-between text-[0.6875rem] text-ash">
        <span>{data[0]?.label}</span>
        <span className="text-ink">
          Maximum {formatValue(peak.value)} · {peak.label}
        </span>
        <span>{data[data.length - 1]?.label}</span>
      </figcaption>
    </figure>
  );
}

/** Classement horizontal — produits les plus vendus, wilayas les plus actives. */
export function BarList({
  data,
  formatValue = (value: number) => formatNumber(value),
  emptyMessage = 'Aucune donnée pour le moment.',
}: {
  data: SeriesPoint[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-[0.875rem] text-ash">{emptyMessage}</p>;
  }

  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <ul className="space-y-4">
      {data.map((point) => (
        <li key={point.label}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="truncate text-[0.875rem] text-ink">{point.label}</span>
            <span className="shrink-0 text-[0.8125rem] text-graphite">
              {formatValue(point.value)}
            </span>
          </div>
          <div className="mt-2 h-1 w-full bg-line">
            <div
              className="h-1 bg-ink"
              style={{ width: `${Math.max(2, (point.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
