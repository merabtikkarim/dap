import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePlanningFromSeances, WEEK_DAYS } from '@/lib/timetable';

export async function GET() {
  try {
    const allSeances = await prisma.seance.findMany({
      orderBy: [{ jour: 'asc' }, { heureDebut: 'asc' }],
      include: { enseignant: true, salle: true },
    });

    const teachers = await prisma.enseignant.findMany();
    const rooms = await prisma.salle.findMany();
    const teacherRestrictions = await prisma.disponibiliteEnseignant.findMany();
    const roomRestrictions = await prisma.disponibiliteSalle.findMany();

    const planning = generatePlanningFromSeances({
      seances: allSeances.map((s) => ({
        id: s.id,
        module: s.module,
        type: s.type,
        jour: s.jour,
        heureDebut: s.heureDebut,
        heureFin: s.heureFin,
        groupe: s.groupe,
        filiere: s.filiere,
        semestre: s.semestre,
        enseignantId: s.enseignantId,
        salleId: s.salleId,
      })),
      teachers,
      rooms,
      existingSeances: allSeances.map((s) => ({
        id: s.id,
        jour: s.jour,
        heureDebut: s.heureDebut,
        heureFin: s.heureFin,
        enseignantId: s.enseignantId,
        salleId: s.salleId,
      })),
      teacherRestrictions: teacherRestrictions.map((r) => ({
        enseignantId: r.enseignantId,
        jour: r.jour,
        heureDebut: r.heureDebut,
        heureFin: r.heureFin,
      })),
      roomRestrictions: roomRestrictions.map((r) => ({
        salleId: r.salleId,
        jour: r.jour,
        heureDebut: r.heureDebut,
        heureFin: r.heureFin,
      })),
    });

    return NextResponse.json({
      days: WEEK_DAYS,
      planned: planning.planned,
      conflicts: planning.conflicts,
      total: allSeances.length,
    });
  } catch (error) {
    console.error('Erreur génération planning:', error);
    return NextResponse.json({ error: 'Impossible de générer le planning' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const draftSeances = Array.isArray(body?.seances) ? body.seances : [body];

    const created = await Promise.all(
      draftSeances.map(async (entry) => {
        const { module, type, jour, heureDebut, heureFin, groupe, filiere, semestre, enseignantId, salleId } = entry;

        if (!module || !type || !jour || !heureDebut || !heureFin || !groupe) {
          throw new Error('Chaque séance doit contenir module, type, jour, heureDebut, heureFin et groupe.');
        }

        return prisma.seance.create({
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
        });
      })
    );

    return NextResponse.json({ success: true, created }, { status: 201 });
  } catch (error) {
    console.error('Erreur création des séances:', error);
    return NextResponse.json({ error: 'Impossible de créer les séances' }, { status: 500 });
  }
}
