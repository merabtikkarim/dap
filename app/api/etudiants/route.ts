// app\api\etudiants\route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adaptez le chemin d'accès à prisma
import { Prisma } from '@prisma/client';

// GET : Récupérer tous les étudiants
export async function GET() {
  try {
    const etudiants = await prisma.etudiant.findMany({
      orderBy: { nom: 'asc' },
    });
    return NextResponse.json(etudiants);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE : Vider toute la table des étudiants
export async function DELETE() {
  try {
    await prisma.etudiant.deleteMany({});
    return NextResponse.json({ success: true, message: 'Base de données vidée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression :', error);
    return NextResponse.json({ error: 'Impossible de vider la base de données' }, { status: 500 });
  }
}

// Colonnes du modèle Etudiant réellement modifiables via ce endpoint.
// Volontairement EXCLUES : matEtudiant (clé primaire, passée à part dans `where`),
// createdAt / updatedAt (gérées automatiquement par Prisma),
// et tout champ qui n'existe pas dans schema.prisma (ex: photoUrl, qui est
// calculé côté front à partir de matEtudiant et n'est pas une colonne DB).
const UPDATABLE_FIELDS = [
  'nin', 'matBac', 'anneeBac', 'carteRfid',
  'nom', 'prenom', 'civilite', 'sexe', 'dateNaissance', 'lieuNaissance',
  'adresse', 'telephone', 'nationalite', 'groupeSanguin', 'situationFamiliale',
  'nomAr', 'prenomAr', 'lieuNaissanceAr', 'nationaliteAr',
  'prenomPere', 'prenomPereAr', 'nomMere', 'nomMereAr', 'prenomMere', 'prenomMereAr',
  'wilayaNaissance', 'wilayaBac', 'wilayaResidence', 'villeNaissance',
  'serieBac', 'libelleBac', 'moyenneBac',
  'dateValidationInscription', 'codeDomaine', 'libelleDomaine', 'libelleDomaineAr',
  'codeFiliere', 'libelleFiliere', 'libelleFiliereAr',
  'structure', 'codeNiveau', 'codeCycle', 'libelleCycle',
  'niveau', 'niveauAr', 'filiere', 'filiereAr', 'specialite', 'specialiteAr',
  'sitIns', 'fraisInscriptionPaye', 'fraisTransportPaye', 'redoublant', 'transfert',
] as const satisfies readonly (keyof Prisma.EtudiantUpdateInput)[];

// Champs numériques/booléens : une chaîne vide venant d'un <input> doit
// devenir `null` (et non "") pour rester compatible avec le type Prisma.
const INT_FIELDS = new Set(['anneeBac']);
const FLOAT_FIELDS = new Set(['moyenneBac']);
const BOOLEAN_FIELDS = new Set(['fraisInscriptionPaye', 'fraisTransportPaye', 'redoublant', 'transfert']);

function sanitizeUpdateData(raw: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  for (const field of UPDATABLE_FIELDS) {
    if (!(field in raw)) continue;
    let value = raw[field];

    if (value === '') value = null;

    if (value !== null && value !== undefined) {
      if (INT_FIELDS.has(field)) {
        const n = typeof value === 'number' ? value : parseInt(String(value), 10);
        value = Number.isNaN(n) ? null : n;
      } else if (FLOAT_FIELDS.has(field)) {
        const n = typeof value === 'number' ? value : parseFloat(String(value));
        value = Number.isNaN(n) ? null : n;
      } else if (BOOLEAN_FIELDS.has(field)) {
        value = typeof value === 'boolean' ? value : value === 'true' || value === true;
      }
    }

    data[field] = value;
  }

  return data;
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { matEtudiant } = body;

    if (!matEtudiant) {
      return NextResponse.json({ error: 'Matricule manquant' }, { status: 400 });
    }

    const updateData = sanitizeUpdateData(body);

    const updated = await prisma.etudiant.update({
      where: { matEtudiant },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
  }
}