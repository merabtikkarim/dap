import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const seances = await prisma.seance.findMany({
      orderBy: [{ jour: 'asc' }, { heureDebut: 'asc' }],
      include: {
        enseignant: true,
        salle: true,
      },
    });

    return NextResponse.json(seances);
  } catch (error) {
    console.error('Erreur récupération séances:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des séances' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { module, type, jour, heureDebut, heureFin, groupe, filiere, semestre, enseignantId, salleId } = body;

    if (!module || !type || !jour || !heureDebut || !heureFin || !groupe) {
      return NextResponse.json({ error: 'Les champs module, type, jour, heureDebut, heureFin et groupe sont obligatoires' }, { status: 400 });
    }

    const seance = await prisma.seance.create({
      data: {
        module: String(module).trim(),
        type: String(type).toUpperCase(),
        jour: String(jour).toUpperCase(),
        heureDebut: String(heureDebut),
        heureFin: String(heureFin),
        groupe: String(groupe).trim(),
        filiere: filiere ? String(filiere).trim() : null,
        semestre: semestre !== undefined ? Number(semestre) : null,
        enseignantId: enseignantId ? String(enseignantId) : null,
        salleId: salleId ? String(salleId) : null,
      },
      include: { enseignant: true, salle: true },
    });

    return NextResponse.json(seance, { status: 201 });
  } catch (error) {
    console.error('Erreur création séance:', error);
    return NextResponse.json({ error: 'Impossible de créer la séance' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.seance.deleteMany({});
    return NextResponse.json({ success: true, message: 'Toutes les séances ont été supprimées.' });
  } catch (error) {
    console.error('Erreur suppression séances:', error);
    return NextResponse.json({ error: 'Impossible de supprimer les séances' }, { status: 500 });
  }
}
