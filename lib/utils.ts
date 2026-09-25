export interface NiveauInfo {
  code: string;           // ex: "PES 2"
  cycleCode: 'PEP' | 'PEM' | 'PES' | 'INCONNU';
  cycleLibelleFr: string; // ex: "Professeur de l'Enseignement Secondaire"
  cycleLibelleAr: string; // ex: "أستاذ التعليم الثانوي"
  annee: number;          // ex: 2
  niveauLibelleFr: string;// ex: "Professeur de l'enseignement secondaire - 2ème année"
  niveauLibelleAr: string;// ex: "أستاذ التعليم الثانوي - السنة الثانية"
}

export function parseCodeNiveau(codeNiveauRaw: string): NiveauInfo {
  if (!codeNiveauRaw) {
    return {
      code: '',
      cycleCode: 'INCONNU',
      cycleLibelleFr: 'Inconnu',
      cycleLibelleAr: 'غير معروف',
      annee: 0,
      niveauLibelleFr: '',
      niveauLibelleAr: '',
    };
  }

  const cleanCode = codeNiveauRaw.trim().toUpperCase();
  const match = cleanCode.match(/^(PEP|PEM|PES)\s*(\d+)$/);

  if (!match) {
    return {
      code: cleanCode,
      cycleCode: 'INCONNU',
      cycleLibelleFr: 'Inconnu',
      cycleLibelleAr: 'غير معروف',
      annee: 0,
      niveauLibelleFr: cleanCode,
      niveauLibelleAr: cleanCode,
    };
  }

  const cycle = match[1] as 'PEP' | 'PEM' | 'PES';
  const annee = parseInt(match[2], 10);

  const cycleData = {
    PEP: {
      fr: "Professeur de l'Enseignement Primaire",
      ar: "أستاذ التعليم الابتدائي",
    },
    PEM: {
      fr: "Professeur de l'Enseignement Moyen",
      ar: "أستاذ التعليم المتوسط",
    },
    PES: {
      fr: "Professeur de l'Enseignement Secondaire",
      ar: "أستاذ التعليم الثانوي",
    },
  }[cycle];

  const anneesAr = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
  const anneeArStr = anneesAr[annee] || `${annee}`;
  const anneeFrStr = annee === 1 ? '1ère année' : `${annee}ème année`;

  return {
    code: cleanCode,
    cycleCode: cycle,
    cycleLibelleFr: cycleData.fr,
    cycleLibelleAr: cycleData.ar,
    annee: annee,
    niveauLibelleFr: `${cycleData.fr} - ${anneeFrStr}`,
    niveauLibelleAr: `${cycleData.ar} - السنة ${anneeArStr}`,
  };
}