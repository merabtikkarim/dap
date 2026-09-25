// app/import-badges/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as pdfjsLib from 'pdfjs-dist';

// Configuration du Worker PDF.js via unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Etudiant {
  matEtudiant: string;
  nom: string;
  prenom: string;
  filiere?: string;
}

interface BadgeExtrait {
  pageIndex: number;
  matEtudiantDetecte: string | null;
  etudiantMatch: Etudiant | null;
  imageBase64: string; // Utilisation visuelle uniquement (pour l'aperçu)
  statut: 'VALIDE' | 'MATRICULE_NON_TROUVE' | 'ETUDIANT_INCONNU' | 'IMPORTE';
  erreur?: string;
}

export default function ImportBadgesPage() {
  const router = useRouter();
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Stockage du PDF original en Base64 pour l'envoi vers l'API PDF
  const [rawPdfBase64, setRawPdfBase64] = useState<string>('');

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [badges, setBadges] = useState<BadgeExtrait[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Charger la liste complète des étudiants
  useEffect(() => {
    fetch('/api/etudiants')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEtudiants(data);
      })
      .catch((err) => console.error('Erreur chargement étudiants:', err))
      .finally(() => setLoadingDb(false));
  }, []);

  // Détection du matricule dans le texte de la page
  const extraireMatricule = (texte: string): string | null => {
    const matches = texte.match(/\b\d{10,14}\b/g);
    if (!matches) return null;

    for (const match of matches) {
      if (etudiants.some((e) => e.matEtudiant === match)) {
        return match;
      }
    }
    return matches[0];
  };

  // Traitement du fichier PDF uploadé
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setBadges([]);
    setUploadMessage('');

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Convertir le fichier source en Base64 pour la découpe serveur ultérieure
      const reader = new FileReader();
      reader.onload = () => {
        setRawPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      setProgress({ current: 0, total: totalPages });

      const extraits: BadgeExtrait[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // 1. Extraction du texte pour détection auto du matricule
        const textContent = await page.getTextContent();
        const fullText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        const matDetecte = extraireMatricule(fullText);
        const etudMatch = etudiants.find((e) => e.matEtudiant === matDetecte) || null;

        // 2. Génération de l'aperçu Canvas pour l'écran
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imageBase64 = canvas.toDataURL('image/png');

          let statut: BadgeExtrait['statut'] = 'VALIDE';
          if (!matDetecte) statut = 'MATRICULE_NON_TROUVE';
          else if (!etudMatch) statut = 'ETUDIANT_INCONNU';

          extraits.push({
            pageIndex: pageNum,
            matEtudiantDetecte: matDetecte,
            etudiantMatch: etudMatch,
            imageBase64,
            statut,
          });
        }

        setProgress({ current: pageNum, total: totalPages });
      }

      setBadges(extraits);
    } catch (err: any) {
      console.error('Erreur lecture PDF:', err);
      alert('Erreur lors de la lecture du fichier PDF : ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Enregistrement des badges au format PDF (découpage page par page)
  const handleAssocierEtEnregistrer = async () => {
    const badgesAImporter = badges.filter((b) => b.statut === 'VALIDE' && b.matEtudiantDetecte);
    if (badgesAImporter.length === 0 || !rawPdfBase64) return;

    setSaving(true);
    setUploadMessage('');
    let reussis = 0;

    for (const badge of badgesAImporter) {
      try {
        const res = await fetch('/api/badges/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matEtudiant: badge.matEtudiantDetecte,
            pdfBase64: rawPdfBase64,
            pageIndex: badge.pageIndex - 1, // pdf-lib utilise un index basé sur 0
          }),
        });

        if (res.ok) {
          reussis++;
          setBadges((prev) =>
            prev.map((b) =>
              b.pageIndex === badge.pageIndex ? { ...b, statut: 'IMPORTE' } : b
            )
          );
        }
      } catch (err) {
        console.error(`Échec pour ${badge.matEtudiantDetecte}`, err);
      }
    }

    setSaving(false);
    setUploadMessage(`Importation PDF terminée : ${reussis} / ${badgesAImporter.length} badges enregistrés sous /public/uploads/badges/[matricule].pdf.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Entête */}
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body">
          <div className="flex justify-between items-center border-b border-base-200 pb-3">
            <div>
              <h1 className="card-title text-2xl font-bold">🎴 Importation & Extraction des Badges PDF</h1>
              <p className="text-sm text-base-content/70">
                Découpez automatiquement un PDF de promotion et sauvegardez chaque page sous format PDF individuel lié au matricule.
              </p>
            </div>
            <button onClick={() => router.back()} className="btn btn-outline btn-sm">
              ⬅️ Retour
            </button>
          </div>

          {/* Zone d'import PDF */}
          <div className="mt-4">
            <label className="label label-text font-semibold">Fichier PDF des Badges (1 badge par page) :</label>
            <input
              type="file"
              accept=".pdf"
              disabled={loadingDb || processing || saving}
              onChange={handlePdfUpload}
              className="file-input file-input-bordered file-input-primary w-full"
            />
          </div>

          {/* Barre de progression */}
          {processing && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>Analyse des pages du PDF...</span>
                <span>{progress.current} / {progress.total} pages</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={progress.current}
                max={progress.total}
              ></progress>
            </div>
          )}
        </div>
      </div>

      {uploadMessage && (
        <div className="alert alert-success shadow-sm">
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Grille des Badges Extrait */}
      {badges.length > 0 && (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <h2 className="text-lg font-bold">
                Badges Détectés ({badges.length})
              </h2>
              <button
                onClick={handleAssocierEtEnregistrer}
                disabled={saving || !badges.some((b) => b.statut === 'VALIDE')}
                className="btn btn-primary"
              >
                {saving ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  '💾 Extraire & Sauvegarder les Badges (PDF)'
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {badges.map((b) => (
                <div
                  key={b.pageIndex}
                  className={`border rounded-lg p-3 space-y-3 bg-base-50 flex flex-col justify-between ${
                    b.statut === 'VALIDE'
                      ? 'border-success/50 bg-success/5'
                      : b.statut === 'IMPORTE'
                      ? 'border-info/50 bg-info/5'
                      : 'border-error/50 bg-error/5'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold px-2 py-1 bg-base-200 rounded">
                        Page {b.pageIndex}
                      </span>
                      {b.statut === 'VALIDE' && (
                        <span className="badge badge-success text-xs font-semibold">Prêt à extraire</span>
                      )}
                      {b.statut === 'IMPORTE' && (
                        <span className="badge badge-info text-xs font-semibold">PDF Créé ✓</span>
                      )}
                      {b.statut === 'MATRICULE_NON_TROUVE' && (
                        <span className="badge badge-error text-xs font-semibold">Matricule non trouvé</span>
                      )}
                      {b.statut === 'ETUDIANT_INCONNU' && (
                        <span className="badge badge-warning text-xs font-semibold">Inconnu en DB</span>
                      )}
                    </div>

                    {/* Aperçu Visuel du Badge */}
                    <div className="relative aspect-[3/2] border rounded overflow-hidden bg-black/5 flex items-center justify-center">
                      <img
                        src={b.imageBase64}
                        alt={`Aperçu Page ${b.pageIndex}`}
                        className="object-contain w-full h-full"
                      />
                    </div>

                    {/* Association Automatique ou Correctif Manuel */}
                    <div className="text-xs space-y-2 pt-2 border-t border-base-200">
                      {b.etudiantMatch ? (
                        <p className="text-primary font-bold">
                          👤 {b.etudiantMatch.nom} {b.etudiantMatch.prenom}
                        </p>
                      ) : (
                        <p className="text-error font-medium">
                          ⚠️ Aucune correspondance trouvée.
                        </p>
                      )}

                      {/* Sélecteur Manuel pour corriger un matricule manquant */}
                      <div className="form-control">
                        <label className="label label-text text-[10px] uppercase font-bold text-base-content/60 p-0 mb-1">
                          Associer à un étudiant :
                        </label>
                        <select
                          value={b.matEtudiantDetecte || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const match = etudiants.find((etud) => etud.matEtudiant === val) || null;
                            setBadges((prev) =>
                              prev.map((item) =>
                                item.pageIndex === b.pageIndex
                                  ? {
                                      ...item,
                                      matEtudiantDetecte: val || null,
                                      etudiantMatch: match,
                                      statut: val && match ? 'VALIDE' : 'MATRICULE_NON_TROUVE',
                                    }
                                  : item
                              )
                            );
                          }}
                          className="select select-bordered select-xs w-full"
                        >
                          <option value="">-- Sélectionner l'étudiant --</option>
                          {etudiants.map((e) => (
                            <option key={e.matEtudiant} value={e.matEtudiant}>
                              {e.matEtudiant} - {e.nom} {e.prenom}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}