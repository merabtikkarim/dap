'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FicheRenseignementPDF, EtudiantPDFProps } from '@/components/FicheRenseignementPDF';

// Chargement dynamique sans SSR
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

function ImpressionFichesContent() {
  const searchParams = useSearchParams();

  const [etudiants, setEtudiants] = useState<EtudiantPDFProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Filtres
  const [selectedFiliere, setSelectedFiliere] = useState(searchParams.get('filiere') || '');
  const [selectedNiveau, setSelectedNiveau] = useState(searchParams.get('niveau') || '');
  const [selectedSpecialite, setSelectedSpecialite] = useState(searchParams.get('specialite') || '');

  // États pour la recherche active et la génération PDF
  const [activeFilters, setActiveFilters] = useState({
    filiere: searchParams.get('filiere') || '',
    niveau: searchParams.get('niveau') || '',
    specialite: searchParams.get('specialite') || '',
  });
  const [isSearching, setIsSearching] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchEtudiants = async () => {
      try {
        const res = await fetch('/api/etudiants');
        const data = await res.json();
        if (Array.isArray(data)) {
          setEtudiants(data);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des étudiants :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEtudiants();
  }, []);

  // Options des listes déroulantes
  const filiereOptions = useMemo(
    () => Array.from(new Set(etudiants.map((e) => e.filiere || e.libelleFiliere).filter(Boolean) as string[])).sort(),
    [etudiants]
  );

  const niveauOptions = useMemo(
    () => Array.from(new Set(etudiants.map((e) => e.niveau || e.codeNiveau).filter(Boolean) as string[])).sort(),
    [etudiants]
  );

  const specialiteOptions = useMemo(
    () => Array.from(new Set(etudiants.map((e) => e.specialite).filter(Boolean) as string[])).sort(),
    [etudiants]
  );

  // Déclencher la recherche au clic sur le bouton
  const handleSearch = () => {
    setIsSearching(true);
    setPdfGenerated(false);

    setTimeout(() => {
      setActiveFilters({
        filiere: selectedFiliere,
        niveau: selectedNiveau,
        specialite: selectedSpecialite,
      });
      setIsSearching(false);
    }, 300);
  };

  // Réinitialiser la recherche
  const handleReset = () => {
    setSelectedFiliere('');
    setSelectedNiveau('');
    setSelectedSpecialite('');
    setActiveFilters({ filiere: '', niveau: '', specialite: '' });
    setPdfGenerated(false);
  };

  // Liste des étudiants filtrés selon les critères validés
  const etudiantsAImprimer = useMemo(() => {
    return etudiants.filter((e) => {
      const filiere = e.filiere || e.libelleFiliere || '';
      const niveau = e.niveau || e.codeNiveau || '';
      const specialite = e.specialite || '';

      return (
        (!activeFilters.filiere || filiere === activeFilters.filiere) &&
        (!activeFilters.niveau || niveau === activeFilters.niveau) &&
        (!activeFilters.specialite || specialite === activeFilters.specialite)
      );
    });
  }, [etudiants, activeFilters]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-xl shadow-md border border-base-200">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-circle btn-ghost btn-sm">
              ←
            </Link>
            <h1 className="text-2xl font-bold">Impression Masse des Fiches A4</h1>
          </div>
          <p className="text-sm text-base-content/70 mt-1">
            Sélectionnez vos critères, recherchez les étudiants puis générez le document PDF.
          </p>
        </div>

        {/* Bouton de téléchargement Direct quand le PDF est prêt */}
        <div className="flex items-center gap-3">
          {isClient && pdfGenerated && etudiantsAImprimer.length > 0 && (
            <PDFDownloadLink
              document={<FicheRenseignementPDF etudiants={etudiantsAImprimer} />}
              fileName={`fiches_${activeFilters.niveau || 'tous'}_${activeFilters.filiere || 'toutes'}_${activeFilters.specialite || 'toutes'}.pdf`}
              className="btn btn-warning font-bold shadow-md"
            >
              {({ loading: pdfLoading }) =>
                pdfLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  `⬇️ Télécharger PDF`
                )
              }
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Barre de Filtres avec Bouton de Recherche */}
      <div className="bg-base-100 p-5 rounded-xl shadow-md border border-base-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label label-text font-semibold">Filière</label>
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="select select-bordered select-sm w-full"
            >
              <option value="">Toutes les filières</option>
              {filiereOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label label-text font-semibold">Niveau</label>
            <select
              value={selectedNiveau}
              onChange={(e) => setSelectedNiveau(e.target.value)}
              className="select select-bordered select-sm w-full"
            >
              <option value="">Tous les niveaux</option>
              {niveauOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label label-text font-semibold">Spécialité</label>
            <select
              value={selectedSpecialite}
              onChange={(e) => setSelectedSpecialite(e.target.value)}
              className="select select-bordered select-sm w-full"
            >
              <option value="">Toutes les spécialités</option>
              {specialiteOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
          {(selectedFiliere || selectedNiveau || selectedSpecialite) && (
            <button onClick={handleReset} className="btn btn-ghost btn-sm text-error">
              Réinitialiser
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={loading || isSearching}
            className="btn btn-primary btn-sm px-6 font-bold shadow-sm"
          >
            {isSearching ? <span className="loading loading-spinner loading-xs"></span> : '🔍 Rechercher'}
          </button>
        </div>
      </div>

      {/* Zone d'affichage et prévisualisation */}
      <div className="bg-base-100 p-4 rounded-xl shadow-md border border-base-200">
        {loading || isSearching ? (
          <div className="flex flex-col justify-center items-center h-80 gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium text-base-content/70">Chargement des étudiants...</p>
          </div>
        ) : etudiantsAImprimer.length === 0 ? (
          <div className="text-center py-20 text-base-content/60">
            <p className="text-lg font-bold">Aucun étudiant trouvé pour cette sélection.</p>
            <p className="text-sm">Veuillez modifier vos filtres et lancer la recherche.</p>
          </div>
        ) : !pdfGenerated ? (
          <div className="space-y-6">
            {/* Résumé des résultats et bouton Générer */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-base-200/50 p-4 rounded-lg border border-base-300 gap-4">
              <div>
                <p className="text-lg font-bold">
                  {etudiantsAImprimer.length} étudiant(s) trouvé(s)
                </p>
                <p className="text-xs text-base-content/70">
                  Prêt à générer les fiches de renseignement A4 pour l'impression.
                </p>
              </div>
              <button
                onClick={() => setPdfGenerated(true)}
                className="btn btn-primary font-bold shadow-md"
              >
                📄 Générer le PDF ({etudiantsAImprimer.length} Fiches)
              </button>
            </div>

            {/* Aperçu sous forme de tableau récapitulatif */}
            <div className="overflow-x-auto max-h-96 border rounded-lg border-base-200">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom & Prénom</th>
                    <th className="text-right">الاسم واللقب</th>
                    <th>Filière</th>
                    <th>Niveau</th>
                    <th>Spécialité</th>
                  </tr>
                </thead>
                <tbody>
                  {etudiantsAImprimer.map((e) => (
                    <tr key={e.matEtudiant}>
                      <td className="font-mono font-bold text-xs">{e.matEtudiant}</td>
                      <td className="font-semibold">{e.nom} {e.prenom}</td>
                      <td className="text-right" dir="rtl">{e.nomAr} {e.prenomAr}</td>
                      <td>{e.filiere || e.libelleFiliere || '-'}</td>
                      <td>{e.niveau || e.codeNiveau || '-'}</td>
                      <td>{e.specialite || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          isClient && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-success">
                  ✓ Document PDF prêt ({etudiantsAImprimer.length} fiches)
                </span>
                <button
                  onClick={() => setPdfGenerated(false)}
                  className="btn btn-ghost btn-xs text-error"
                >
                  ✕ Fermer la prévisualisation
                </button>
              </div>
              <div className="w-full h-[75vh] rounded-lg overflow-hidden border border-base-300">
                <PDFViewer width="100%" height="100%" className="border-none">
                  <FicheRenseignementPDF etudiants={etudiantsAImprimer} />
                </PDFViewer>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function ImpressionFichesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <ImpressionFichesContent />
    </Suspense>
  );
}