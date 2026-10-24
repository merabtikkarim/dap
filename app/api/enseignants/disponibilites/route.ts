import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enseignantId = searchParams.get('enseignantId');
    const disponibilites = await prisma.disponibiliteEnseignant.findMany({
      where: enseignantId ? { enseignantId } : undefined,
      orderBy: [{ jour: 'asc' }, { heureDebut: 'asc' }],
      include: { enseignant: true },
    });

    return NextResponse.json(disponibilites);
  } catch (error) {
    console.error('Erreur récupération disponibilités enseignant:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des disponibilités' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { enseignantId, jour, heureDebut, heureFin, motif } = body;

    if (!enseignantId || !jour || !heureDebut || !heureFin) {
      return NextResponse.json({ error: 'enseignantId, jour, heureDebut et heureFin sont obligatoires.' }, { status: 400 });
    }

    const disponibilite = await prisma.disponibiliteEnseignant.create({
      data: {
        enseignantId: String(enseignantId),
        jour: String(jour).toUpperCase(),
        heureDebut: String(heureDebut),
        heureFin: String(heureFin),
        motif: motif ? String(motif).trim() : null,
      },
      include: { enseignant: true },
    });

    return NextResponse.json(disponibilite, { status: 201 });
  } catch (error) {
    console.error('Erreur création disponibilité enseignant:', error);
    return NextResponse.json({ error: 'Impossible de créer la disponibilité enseignant' }, { status: 500 });
  }
}
