import { PrismaClient } from '@prisma/client';

/**
 * En développement, Next.js recharge les modules à chaud : sans ce cache global
 * chaque rechargement ouvrirait un nouveau pool de connexions et saturerait Neon.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/** Codes Prisma correspondant à une base injoignable, et non à une erreur de requête. */
const TRANSIENT_CODES = new Set(['P1000', 'P1001', 'P1002', 'P1008', 'P1017']);

/**
 * Reconnaît une panne de connexion passagère.
 *
 * Prisma signale ce genre d'incident de trois manières différentes selon le
 * moment où il survient, et il faut les couvrir toutes :
 *
 *  - `PrismaClientKnownRequestError` porte le code dans `.code` (P1001…) ;
 *  - `PrismaClientInitializationError`, levée quand la connexion n'a jamais pu
 *    s'établir, expose `.errorCode` — souvent `undefined` — et laisse `.code`
 *    vide. C'est précisément le cas d'une base serverless endormie, et se fier
 *    au seul `.code` laissait passer l'erreur la plus fréquente ;
 *  - en dernier recours, le message est explicite et sert de filet.
 */
function isTransient(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const { name, code, errorCode, message } = error as {
    name?: unknown;
    code?: unknown;
    errorCode?: unknown;
    message?: unknown;
  };

  if (name === 'PrismaClientInitializationError') return true;
  if (typeof code === 'string' && TRANSIENT_CODES.has(code)) return true;
  if (typeof errorCode === 'string' && TRANSIENT_CODES.has(errorCode)) return true;

  return (
    typeof message === 'string' &&
    /can't reach database server|server has closed the connection|connection pool timed out|connection refused/i.test(
      message,
    )
  );
}

/**
 * Rejoue une lecture lorsque la base est momentanément injoignable.
 *
 * Neon suspend l'instance après quelques minutes d'inactivité et met une à
 * trois secondes à se réveiller. Sans cette reprise, la première requête d'un
 * build — ou de la première visiteuse de la journée — échoue alors que la base
 * est parfaitement saine : au build, cela fait échouer le déploiement entier.
 *
 * Seules les erreurs de connexion sont rejouées. Une requête invalide ou une
 * contrainte violée échoue immédiatement : la réessayer ne ferait que masquer
 * un vrai défaut.
 */
export async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransient(error)) throw error;

      lastError = error;

      if (attempt < attempts - 1) {
        // Attente croissante : 400 ms, puis 1200 ms — le temps qu'il faut à une
        // instance suspendue pour se réveiller.
        const delay = 400 * 3 ** attempt;
        console.warn(`[base] injoignable, nouvelle tentative dans ${delay} ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
