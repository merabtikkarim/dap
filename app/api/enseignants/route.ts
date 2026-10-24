import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const enseignants = await prisma.enseignant.findMany({
      orderBy: { nom: 'asc' },
      include: { disponibilites: true },
    });

    return NextResponse.json(enseignants);
  } catch (error) {
    console.error('Erreur récupération enseignants:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des enseignants' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, prenom, email, specialite, grade, statut, maxCoursParJour, maxHeuresParSemaine } = body;

    if (!nom || !prenom) {
      return NextResponse.json({ error: 'Le nom et le prénom sont obligatoires' }, { status: 400 });
    }

    const enseignant = await prisma.enseignant.create({
      data: {
        nom: String(nom).trim(),
        prenom: String(prenom).trim(),
        email: email ? String(email).trim() : null,
        specialite: specialite ? String(specialite).trim() : null,
        grade: grade ? String(grade).trim() : null,
        statut: statut ? String(statut).trim() : 'Permanent',
        maxCoursParJour: maxCoursParJour !== undefined ? Number(maxCoursParJour) : 3,
        maxHeuresParSemaine: maxHeuresParSemaine !== undefined ? Number(maxHeuresParSemaine) : 18,
      },
    });

    return NextResponse.json(enseignant, { status: 201 });
  } catch (error) {
    console.error('Erreur création enseignant:', error);
    return NextResponse.json({ error: 'Impossible de créer l’enseignant' }, { status: 500 });
  }
}
