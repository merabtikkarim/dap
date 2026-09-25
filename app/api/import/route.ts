// app/api/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

// 1. Fonction d'extraction académique (Niveau, Filière, Spécialité)
export function parseAcademicData(
  codeNiveauRaw?: string,
  libelleFiliereRaw?: string,
  libelleFiliereArRaw?: string
) {
  let filiere = '';
  let filiereAr = '';
  let niveau = '';
  let niveauAr = '';

  if (codeNiveauRaw) {
    const match = codeNiveauRaw.trim().match(/(PEP|PEM|PES)\s*(\d+)/i);
    if (match) {
      const cycle = match[1].toUpperCase();
      const numAnnee = parseInt(match[2], 10);

      filiere = cycle;
      const cycleArMap: Record<string, string> = {
        PES: 'أستاذ التعليم الثانوي',
        PEM: 'أستاذ التعليم المتوسط',
        PEP: 'أستاذ المدرسة الابتدائية', // Mise à jour pour PEP
      };
      filiereAr = cycleArMap[cycle] || '';

      const anneesFr: Record<number, string> = {
        1: '1ère année',
        2: '2ème année',
        3: '3ème année',
        4: '4ème année',
        5: '5ème année',
      };
      const anneesAr: Record<number, string> = {
        1: 'السنة الأولى',
        2: 'السنة الثانية',
        3: 'السنة الثالثة',
        4: 'السنة الرابعة',
        5: 'السنة الخامسة',
      };

      niveau = anneesFr[numAnnee] || `${numAnnee}ème année`;
      niveauAr = anneesAr[numAnnee] || `السنة ${numAnnee}`;
    }
  }

  // Extraction propre de la spécialité en Français
  let specialite = '';
  if (libelleFiliereRaw) {
    // 1. Supprime les sigles entre parenthèses comme (p.e.m.), (p.e.s.), (p.e.p.)
    const clean = libelleFiliereRaw.replace(/\s*\([^)]*\)/g, '').trim();
    
    // 2. Supprime les préfixes "Professeur de l'enseignement ..." ou "Professeur de l'ecole primaire ..."
    const extracted = clean
      .replace(
        /^(?:Professeur\s+de\s+l[’\'](?:enseignement\s+(?:secondaire|moyen|primaire)|ecole\s+primaire|école\s+primaire)\s+(?:en|de)?\s*)/i,
        ''
      )
      .trim();

    if (extracted) {
      specialite = extracted.charAt(0).toUpperCase() + extracted.slice(1);
    }
  }

  // Extraction propre de la spécialité en Arabe
  let specialiteAr = '';
  if (libelleFiliereArRaw) {
    // Supprime les préfixes simples ou doubles (ex: "أستاذ التعليم الابتدائي - أستاذ المدرسة الابتدائية في")
    specialiteAr = libelleFiliereArRaw
      .replace(
        /^(?:(?:أستاذ\s+(?:التعليم\s+(?:الثانوي|المتوسط|الابتدائي)|المدرسة\s+الابتدائية))\s*(?:-\s*)?)+(?:في)?\s*/i,
        ''
      )
      .trim();
  }

  return {
    filiere,
    filiereAr,
    niveau,
    niveauAr,
    specialite,
    specialiteAr,
  };
}
// 2. Nettoyage et récupération dynamique des champs du CSV
function getVal(row: Record<string, any>, possibleKeys: string[]): string {
  const normalizedRow: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.replace(/^\ufeff/, '').trim().toLowerCase();
    const val = row[key];
    normalizedRow[cleanKey] = val !== undefined && val !== null ? String(val).trim() : '';
  }

  for (const k of possibleKeys) {
    const cleanK = k.trim().toLowerCase();
    if (normalizedRow[cleanK]) {
      return normalizedRow[cleanK];
    }
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    let text = await file.text();

    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
    });

    const rows = parsed.data;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Le fichier CSV est vide ou illisible' }, { status: 400 });
    }

    let importedCount = 0;

    for (const row of rows) {
      const matEtudiant = getVal(row, [
        'Mat. Etudiant',
        'mat. etudiant',
        'Matricule',
        'mat_etudiant',
        'N° Inscription',
      ]);

      if (!matEtudiant) continue;

      const nom = getVal(row, ['Nom', 'nom']);
      const prenom = getVal(row, ['Prénom', 'Prenom', 'prénom']);
      const nomAr = getVal(row, ['اللقب', 'nom_ar']);
      const prenomAr = getVal(row, ['الإسم', 'الاسم', 'prenom_ar']);

      const codeNiveau = getVal(row, ['Code niveau', 'code_niveau']);
      const libelleFiliere = getVal(row, ['Libellé filière', 'libelle_filiere']);
      const libelleFiliereAr = getVal(row, ['القطاع', 'libelle_filiere_ar']);

      const moyenneBacRaw = getVal(row, ['Moyenne du bac', 'Moyenne BAC', 'moyenne_bac']);
      const moyenneBac = moyenneBacRaw ? parseFloat(moyenneBacRaw.replace(',', '.')) : null;

      const anneeBacRaw = getVal(row, ['Année du bac', 'annee_bac']);
      const anneeBac = anneeBacRaw ? parseInt(anneeBacRaw, 10) : null;

      // Processing des données académiques
      const academicData = parseAcademicData(codeNiveau, libelleFiliere, libelleFiliereAr);

      const studentData = {
        nom: nom || 'Inconnu',
        prenom: prenom || 'Inconnu',
        nomAr: nomAr || null,
        prenomAr: prenomAr || null,
        codeNiveau: codeNiveau || null,
        libelleFiliere: libelleFiliere || null,
        libelleFiliereAr: libelleFiliereAr || null,
        moyenneBac: moyenneBac && !isNaN(moyenneBac) ? moyenneBac : null,

        // Champs extraits via parseAcademicData
        niveau: academicData.niveau || null,
        niveauAr: academicData.niveauAr || null,
        filiere: academicData.filiere || null,
        filiereAr: academicData.filiereAr || null,
        specialite: academicData.specialite || null,
        specialiteAr: academicData.specialiteAr || null,

        // Données d'état civil & scolarité
        nin: getVal(row, ['NIN', 'nin']) || null,
        matBac: getVal(row, ['Mat. BAC', 'mat_bac']) || null,
        anneeBac: anneeBac && !isNaN(anneeBac) ? anneeBac : null,
        carteRfid: getVal(row, ['carte rfid', 'carte_rfid']) || null,
        civilite: getVal(row, ['Civilité', 'civilite']) || null,
        sexe: getVal(row, ['Sexe', 'sexe']) || null,
        dateNaissance: getVal(row, ['Date de naiss.', 'date_naissance']) || null,
        lieuNaissance: getVal(row, ['Lieu de naissance', 'lieu_naissance']) || null,
        lieuNaissanceAr: getVal(row, ['مكان الميلاد']) || null,
        adresse: getVal(row, ['adresse']) || null,
        telephone: getVal(row, ['N° de téléphone', 'telephone']) || null,
        nationalite: getVal(row, ['Nationalité', 'nationalite']) || null,
        nationaliteAr: getVal(row, ['الجنسية']) || null,
        groupeSanguin: getVal(row, ['Groupe sanguin', 'فصيلة الدم']) || null,
        prenomPere: getVal(row, ['Prénom du père']) || null,
        prenomPereAr: getVal(row, ['إسم الأب']) || null,
        nomMere: getVal(row, ['Nom de la mère']) || null,
        nomMereAr: getVal(row, ['لقب الأم']) || null,
        prenomMere: getVal(row, ['Prénom de la mère']) || null,
        prenomMereAr: getVal(row, ['إسم الأم']) || null,
        wilayaNaissance: getVal(row, ['Wilaya de naissance']) || null,
        wilayaBac: getVal(row, ['Wilaya du bac']) || null,
        wilayaResidence: getVal(row, ['Wilaya de résidence']) || null,
        villeNaissance: getVal(row, ['Ville de naissance']) || null,
        serieBac: getVal(row, ['Série du bac']) || null,
        libelleBac: getVal(row, ['Libelle de bac']) || null,
        dateValidationInscription: getVal(row, ['Date validation inscription']) || null,
        codeDomaine: getVal(row, ['Code domaine']) || null,
        libelleDomaine: getVal(row, ['Libellé domaine']) || null,
        libelleDomaineAr: getVal(row, ['الفرع']) || null,
        codeFiliere: getVal(row, ['Code filière']) || null,
        structure: getVal(row, ['Structure']) || null,
        codeCycle: getVal(row, ['Code cycle']) || null,
        libelleCycle: getVal(row, ['Libellé cycle']) || null,
        sitIns: getVal(row, ["Sit. d'ins."]) || null,
      };

      await prisma.etudiant.upsert({
        where: { matEtudiant },
        update: studentData,
        create: {
          matEtudiant,
          ...studentData,
          fraisInscriptionPaye: true,
        },
      });

      importedCount++;
    }

    return NextResponse.json({ success: true, count: importedCount });
  } catch (error) {
    console.error("Erreur d'importation :", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'importation." }, { status: 500 });
  }
}