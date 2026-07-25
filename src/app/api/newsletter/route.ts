import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(180),
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requête illisible.' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Adresse e-mail invalide.' },
      { status: 400 },
    );
  }

  // `upsert` : réinscrire une adresse déjà connue réactive simplement le contact,
  // sans révéler au visiteur qu'elle figurait déjà dans la base.
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { isActive: true },
    create: { email: parsed.data.email },
  });

  return NextResponse.json({ message: 'Merci, votre inscription est enregistrée.' });
}
