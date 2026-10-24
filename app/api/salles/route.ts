import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const salles = await prisma.salle.findMany({
      orderBy: { nom: 'asc' },
      include: { disponibilites: true },
    });

    return NextResponse.json(salles);
  } catch (error) {
    console.error('Erreur récupération salles:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des salles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, type, capacite, batiment, numero } = body;

    if (!nom) {
      return NextResponse.json({ error: 'Le nom de la salle est obligatoire' }, { status: 400 });
    }

    const salle = await prisma.salle.create({
      data: {
        nom: String(nom).trim(),
        type: type ? String(type).trim() : 'Amphi',
        capacite: capacite !== undefined ? Number(capacite) : 30,
        batiment: batiment ? String(batiment).trim() : null,
        numero: numero ? String(numero).trim() : null,
      },
    });

    return NextResponse.json(salle, { status: 201 });
  } catch (error) {
    console.error('Erreur création salle:', error);
    return NextResponse.json({ error: 'Impossible de créer la salle' }, { status: 500 });
  }
}
