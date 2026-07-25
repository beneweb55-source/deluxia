import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/order-schema';

const schema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(60),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^0[1-9]\d{7,8}$/.test(value), {
      message: 'Numéro invalide. Exemple : 07 72 61 05 46.',
    }),
  email: z
    .union([z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(180), z.literal('')])
    .optional()
    .transform((value) => (value ? value : null)),
  subject: z.string().trim().min(2, 'Choisissez un sujet.').max(120),
  message: z
    .string()
    .trim()
    .min(10, 'Détaillez un peu votre message (10 caractères minimum).')
    .max(2000, 'Message trop long (2000 caractères maximum).'),
});

/**
 * Réception d'un message du formulaire de contact.
 *
 * Le téléphone est obligatoire et l'e-mail facultatif : c'est l'inverse de
 * l'habitude occidentale, mais c'est par téléphone que se règlent la quasi-
 * totalité des échanges commerciaux en Algérie.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requête illisible.' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return NextResponse.json(
      { message: 'Certaines informations sont incomplètes.', fieldErrors },
      { status: 400 },
    );
  }

  await prisma.contactMessage.create({ data: parsed.data });

  return NextResponse.json(
    { message: 'Message envoyé. Nous vous répondons sous 24 h ouvrées.' },
    { status: 201 },
  );
}
