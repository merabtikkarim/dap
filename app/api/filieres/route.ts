// app/api/filieres/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Récupère les filières uniques
    const filieres = await prisma.etudiant.findMany({
      where: {
        filiere: { not: null },
      },
      select: {
        filiere: true,
        filiereAr: true,
      },
      distinct: ['filiere'],
      orderBy: { filiere: 'asc' },
    });

    return NextResponse.json(filieres);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des filières' },
      { status: 500 }
    );
  }
}