import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const salleId = searchParams.get('salleId');
    const disponibilites = await prisma.disponibiliteSalle.findMany({
      where: salleId ? { salleId } : undefined,
      orderBy: [{ jour: 'asc' }, { heureDebut: 'asc' }],
      include: { salle: true },
    });

    return NextResponse.json(disponibilites);
  } catch (error) {
    console.error('Erreur récupération disponibilités salle:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des disponibilités' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { salleId, jour, heureDebut, heureFin, motif } = body;

    if (!salleId || !jour || !heureDebut || !heureFin) {
      return NextResponse.json({ error: 'salleId, jour, heureDebut et heureFin sont obligatoires.' }, { status: 400 });
    }

    const disponibilite = await prisma.disponibiliteSalle.create({
      data: {
        salleId: String(salleId),
        jour: String(jour).toUpperCase(),
        heureDebut: String(heureDebut),
        heureFin: String(heureFin),
        motif: motif ? String(motif).trim() : null,
      },
      include: { salle: true },
    });

    return NextResponse.json(disponibilite, { status: 201 });
  } catch (error) {
    console.error('Erreur création disponibilité salle:', error);
    return NextResponse.json({ error: 'Impossible de créer la disponibilité salle' }, { status: 500 });
  }
}
