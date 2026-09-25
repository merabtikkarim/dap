// app/etudiants/page.tsx
'use client';

import { useState, useEffect, ChangeEvent, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Etudiant {
  matEtudiant: string;
  nin?: string;
  matBac?: string;
  anneeBac?: number;
  carteRfid?: string;
  nom: string;
  prenom: string;
  civilite?: string;
  sexe?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
  telephone?: string;
  nationalite?: string;
  groupeSanguin?: string;
  situationFamiliale?: string;
  photoUrl?: string;
  nomAr?: string;
  prenomAr?: string;
  lieuNaissanceAr?: string;
  nationaliteAr?: string;
  prenomPere?: string;
  prenomPereAr?: string;
  nomMere?: string;
  nomMereAr?: string;
  prenomMere?: string;
  prenomMereAr?: string;
  wilayaNaissance?: string;
  wilayaBac?: string;
  wilayaResidence?: string;
  villeNaissance?: string;
  serieBac?: string;
  libelleBac?: string;
  moyenneBac?: number;
  dateValidationInscription?: string;
  codeDomaine?: string;
  libelleDomaine?: string;
  libelleDomaineAr?: string;
  codeFiliere?: string;
  libelleFiliere?: string;
  libelleFiliereAr?: string;
  structure?: string;
  codeNiveau?: string;
  codeCycle?: string;
  libelleCycle?: string;
  niveau?: string;
  niveauAr?: string;
  filiere?: string;
  filiereAr?: string;
  specialite?: string;
  specialiteAr?: string;
  sitIns?: string;
  fraisInscriptionPaye: boolean;
  fraisTransportPaye?: boolean;
  redoublant?: boolean;
  transfert?: boolean;
}

// ----------------------------------------------------------------------
// FORMULAIRE D'ÉDITION STRUCTURÉ PAR SECTIONS (MODALE)
// ----------------------------------------------------------------------
function FormulaireEditionEtudiant({
  etudiant,
  onSuccess,
  onCancel,
}: {
  etudiant: Etudiant;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Etudiant>({ ...etudiant });
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [formError, setFormError] = useState('');
  const [mediaTimestamp, setMediaTimestamp] = useState(Date.now());

  useEffect(() => {
    setFormData({ ...etudiant });
  }, [etudiant]);

  const handleChange = (field: keyof Etudiant, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOverwritePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.matEtudiant) return;

    setUploadingMedia(true);
    setFormError('');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('matEtudiant', formData.matEtudiant);

    try {
      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const result = await res.json();
        if (result.photoUrl) handleChange('photoUrl', result.photoUrl);
        setMediaTimestamp(Date.now());
      } else {
        setFormError("Erreur lors de l'envoi de la photo.");
      }
    } catch {
      setFormError('Erreur réseau lors du chargement de la photo.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleOverwritePdf = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.matEtudiant) return;

    setUploadingMedia(true);
    setFormError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawPdfBase64 = reader.result as string;
        const res = await fetch('/api/badges/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matEtudiant: formData.matEtudiant,
            pdfBase64: rawPdfBase64,
          }),
        });

        if (res.ok) {
          setMediaTimestamp(Date.now());
        } else {
          setFormError('Erreur lors du remplacement du badge PDF.');
        }
        setUploadingMedia(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setFormError('Erreur lors de la lecture du fichier PDF.');
      setUploadingMedia(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matEtudiant) return;

    setSaving(true);
    setFormError('');

    try {
      const res = await fetch('/api/etudiants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const errorData = await res.json();
        setFormError(errorData.error || 'Erreur lors de la mise à jour.');
      }
    } catch {
      setFormError('Erreur réseau lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-5 space-y-6 text-sm">
      {formError && (
        <div className="alert alert-error text-xs py-2 shadow-sm">
          <span>{formError}</span>
        </div>
      )}

      {/* Bloc Médias (Photo & PDF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-base-200/60 p-3 rounded-lg border border-base-200">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-14 h-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1 overflow-hidden bg-base-300">
              <img
                src={formData.photoUrl || `/uploads/photos/${formData.matEtudiant}.jpg?t=${mediaTimestamp}`}
                alt={`${formData.nom} ${formData.prenom}`}
                onError={(err) => {
                  (err.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${formData.nom} ${formData.prenom}`
                  )}&background=0D8ABC&color=fff&bold=true`;
                }}
              />
            </div>
          </div>
          <div>
            <label className={`btn btn-xs btn-outline btn-primary ${uploadingMedia ? 'btn-disabled' : ''}`}>
              📷 Changer photo
              <input type="file" accept="image/*" onChange={handleOverwritePhoto} className="hidden" disabled={uploadingMedia} />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <a
            href={`/uploads/badges/${formData.matEtudiant}.pdf?t=${mediaTimestamp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xs btn-ghost border border-base-300"
          >
            👁️ Voir PDF
          </a>
          <label className={`btn btn-xs btn-secondary ${uploadingMedia ? 'btn-disabled' : ''}`}>
            📑 Remplacer PDF
            <input type="file" accept=".pdf" onChange={handleOverwritePdf} className="hidden" disabled={uploadingMedia} />
          </label>
        </div>
      </div>

      {/* 1. IDENTITÉ */}
<div className="space-y-3">
  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-base-200 pb-1">
    Identité
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

    {/* Nom */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Nom (FR)
      </label>
      <input
        type="text"
        value={formData.nom || ''}
        onChange={(e) => handleChange('nom', e.target.value)}
        className="input input-bordered input-sm w-full mt-1"
        required
      />
    </div>

    <div>
      <label
        className="label-text text-xs text-base-content/70 block text-right"
        dir="rtl"
      >
        اللقب (AR)
      </label>
      <input
        type="text"
        dir="rtl"
        value={formData.nomAr || ''}
        onChange={(e) => handleChange('nomAr', e.target.value)}
        className="input input-bordered input-sm w-full text-right mt-1"
      />
    </div>

    {/* Prénom */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Prénom (FR)
      </label>
      <input
        type="text"
        value={formData.prenom || ''}
        onChange={(e) => handleChange('prenom', e.target.value)}
        className="input input-bordered input-sm w-full mt-1"
        required
      />
    </div>

    <div>
      <label
        className="label-text text-xs text-base-content/70 block text-right"
        dir="rtl"
      >
        الاسم (AR)
      </label>
      <input
        type="text"
        dir="rtl"
        value={formData.prenomAr || ''}
        onChange={(e) => handleChange('prenomAr', e.target.value)}
        className="input input-bordered input-sm w-full text-right mt-1"
      />
    </div>

    {/* Civilité */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Civilité
      </label>
      <select
        value={formData.civilite || ''}
        onChange={(e) => handleChange('civilite', e.target.value)}
        className="select select-bordered select-sm w-full mt-1"
      >
        <option value="">-- Civilité --</option>
        <option value="M.">M.</option>
        <option value="Mlle">Mlle</option>
        <option value="Mme">Mme</option>
      </select>
    </div>

    {/* Sexe */}
<div>
  <label className="label-text text-xs text-base-content/70">
    Sexe
  </label>

  <select
    value={formData.sexe || ''}
    onChange={(e) => handleChange('sexe', e.target.value)}
    className="select select-bordered select-sm w-full mt-1"
  >
    <option value="">-- Sexe --</option>
    <option value="MASCULIN">MASCULIN</option>
    <option value="FEMININ">FEMININ</option>
  </select>
</div>

    {/* Date de naissance */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Date de Naissance
      </label>
      <input
        type="text"
        value={formData.dateNaissance || ''}
        onChange={(e) => handleChange('dateNaissance', e.target.value)}
        placeholder="JJ/MM/AAAA"
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Téléphone */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Téléphone
      </label>
      <input
        type="text"
        value={formData.telephone || ''}
        onChange={(e) => handleChange('telephone', e.target.value)}
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Lieu de naissance */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Lieu de Naissance (FR / AR)
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.lieuNaissance || ''}
          onChange={(e) =>
            handleChange('lieuNaissance', e.target.value)
          }
          placeholder="FR"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          dir="rtl"
          value={formData.lieuNaissanceAr || ''}
          onChange={(e) =>
            handleChange('lieuNaissanceAr', e.target.value)
          }
          placeholder="مكان الميلاد"
          className="input input-bordered input-sm w-full text-right"
        />
      </div>
    </div>

    {/* Wilaya / Ville naissance */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Wilaya / Ville de Naissance
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.wilayaNaissance || ''}
          onChange={(e) =>
            handleChange('wilayaNaissance', e.target.value)
          }
          placeholder="Wilaya"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          value={formData.villeNaissance || ''}
          onChange={(e) =>
            handleChange('villeNaissance', e.target.value)
          }
          placeholder="Ville"
          className="input input-bordered input-sm w-full"
        />
      </div>
    </div>

    {/* Adresse */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Adresse
      </label>
      <input
        type="text"
        value={formData.adresse || ''}
        onChange={(e) => handleChange('adresse', e.target.value)}
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Wilaya résidence */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Wilaya de Résidence
      </label>
      <input
        type="text"
        value={formData.wilayaResidence || ''}
        onChange={(e) =>
          handleChange('wilayaResidence', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Situation familiale */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Situation Familiale
      </label>
      <select
        value={formData.situationFamiliale || ''}
        onChange={(e) =>
          handleChange('situationFamiliale', e.target.value)
        }
        className="select select-bordered select-sm w-full mt-1"
      >
        <option value="">-- Situation --</option>
        <option value="Célibataire">Célibataire</option>
        <option value="Marié(e)">Marié(e)</option>
        <option value="Divorcé(e)">Divorcé(e)</option>
        <option value="Veuf/Veuve">Veuf/Veuve</option>
      </select>
    </div>

    {/* Nationalité */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Nationalité (FR / AR)
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.nationalite || 'Algerienne'}
          onChange={(e) =>
            handleChange('nationalite', e.target.value)
          }
          placeholder="FR"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          dir="rtl"
          value={formData.nationaliteAr || ''}
          onChange={(e) =>
            handleChange('nationaliteAr', e.target.value)
          }
          placeholder="الجنسية"
          className="input input-bordered input-sm w-full text-right"
        />
      </div>
    </div>

    {/* NIN / RFID */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        NIN / Carte RFID
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.nin || ''}
          onChange={(e) => handleChange('nin', e.target.value)}
          placeholder="NIN"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          value={formData.carteRfid || ''}
          onChange={(e) =>
            handleChange('carteRfid', e.target.value)
          }
          placeholder="RFID"
          className="input input-bordered input-sm w-full font-mono"
        />
      </div>
    </div>

    {/* Groupe sanguin */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Groupe Sanguin
      </label>
      <select
        value={formData.groupeSanguin || ''}
        onChange={(e) =>
          handleChange('groupeSanguin', e.target.value)
        }
        className="select select-bordered select-sm w-full mt-1"
      >
        <option value="">-- Groupe sanguin --</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>
    </div>

  </div>
</div>


{/* 2. FILIATION */}
<div className="space-y-3">
  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-base-200 pb-1">
    Filiation & Parents
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

    {/* Père */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Prénom Père (FR / AR)
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.prenomPere || ''}
          onChange={(e) =>
            handleChange('prenomPere', e.target.value)
          }
          placeholder="FR"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          dir="rtl"
          value={formData.prenomPereAr || ''}
          onChange={(e) =>
            handleChange('prenomPereAr', e.target.value)
          }
          placeholder="اسم الأب"
          className="input input-bordered input-sm w-full text-right"
        />
      </div>
    </div>

    {/* Nom mère */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Nom Mère (FR / AR)
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.nomMere || ''}
          onChange={(e) =>
            handleChange('nomMere', e.target.value)
          }
          placeholder="FR"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          dir="rtl"
          value={formData.nomMereAr || ''}
          onChange={(e) =>
            handleChange('nomMereAr', e.target.value)
          }
          placeholder="لقب الأم"
          className="input input-bordered input-sm w-full text-right"
        />
      </div>
    </div>

    {/* Prénom mère */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Prénom Mère (FR / AR)
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.prenomMere || ''}
          onChange={(e) =>
            handleChange('prenomMere', e.target.value)
          }
          placeholder="FR"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          dir="rtl"
          value={formData.prenomMereAr || ''}
          onChange={(e) =>
            handleChange('prenomMereAr', e.target.value)
          }
          placeholder="اسم الأم"
          className="input input-bordered input-sm w-full text-right"
        />
      </div>
    </div>

  </div>
</div>


{/* 3. BACCALAURÉAT & ORIGINE */}
<div className="space-y-3">
  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-base-200 pb-1">
    Baccalauréat & Origine
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

    {/* Matricule BAC / Année */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Matricule BAC / Année
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.matBac || ''}
          onChange={(e) =>
            handleChange('matBac', e.target.value)
          }
          placeholder="Mat BAC"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="number"
          value={formData.anneeBac || ''}
          onChange={(e) =>
            handleChange(
              'anneeBac',
              e.target.value
                ? parseInt(e.target.value)
                : undefined
            )
          }
          placeholder="Année"
          className="input input-bordered input-sm w-full"
        />
      </div>
    </div>

    {/* Moyenne BAC */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Moyenne BAC
      </label>
      <input
        type="number"
        step="0.01"
        value={formData.moyenneBac ?? ''}
        onChange={(e) =>
          handleChange(
            'moyenneBac',
            e.target.value
              ? parseFloat(e.target.value)
              : undefined
          )
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Série BAC */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Série BAC
      </label>
      <input
        type="text"
        value={formData.serieBac || ''}
        onChange={(e) =>
          handleChange('serieBac', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Libellé BAC */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Libellé BAC
      </label>
      <input
        type="text"
        value={formData.libelleBac || ''}
        onChange={(e) =>
          handleChange('libelleBac', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Wilaya BAC */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Wilaya BAC
      </label>
      <input
        type="text"
        value={formData.wilayaBac || ''}
        onChange={(e) =>
          handleChange('wilayaBac', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Date validation inscription */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Date Validation Inscription
      </label>
      <input
        type="text"
        value={formData.dateValidationInscription || ''}
        onChange={(e) =>
          handleChange(
            'dateValidationInscription',
            e.target.value
          )
        }
        placeholder="JJ/MM/AAAA"
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

  </div>
</div>


{/* 4. PARCOURS ACADÉMIQUE */}
<div className="space-y-3">
  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-base-200 pb-1">
    Parcours Académique
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

    {/* Niveau */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Niveau
      </label>
      <input
        type="text"
        value={formData.niveau || ''}
        onChange={(e) =>
          handleChange('niveau', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Filière */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Filière
      </label>
      <input
        type="text"
        value={formData.filiere || ''}
        onChange={(e) =>
          handleChange('filiere', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Spécialité */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Spécialité
      </label>
      <input
        type="text"
        value={formData.specialite || ''}
        onChange={(e) =>
          handleChange('specialite', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Niveau AR */}
    <div>
      <label
        className="label-text text-xs text-base-content/70 block text-right"
        dir="rtl"
      >
        المستوى (AR)
      </label>
      <input
        type="text"
        dir="rtl"
        value={formData.niveauAr || ''}
        onChange={(e) =>
          handleChange('niveauAr', e.target.value)
        }
        className="input input-bordered input-sm w-full text-right mt-1"
      />
    </div>

    {/* Filière AR */}
    <div>
      <label
        className="label-text text-xs text-base-content/70 block text-right"
        dir="rtl"
      >
        الشعبة (AR)
      </label>
      <input
        type="text"
        dir="rtl"
        value={formData.filiereAr || ''}
        onChange={(e) =>
          handleChange('filiereAr', e.target.value)
        }
        className="input input-bordered input-sm w-full text-right mt-1"
      />
    </div>

    {/* Spécialité AR */}
    <div>
      <label
        className="label-text text-xs text-base-content/70 block text-right"
        dir="rtl"
      >
        التخصص (AR)
      </label>
      <input
        type="text"
        dir="rtl"
        value={formData.specialiteAr || ''}
        onChange={(e) =>
          handleChange('specialiteAr', e.target.value)
        }
        className="input input-bordered input-sm w-full text-right mt-1"
      />
    </div>

    {/* Domaine */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Code / Libellé Domaine
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.codeDomaine || ''}
          onChange={(e) =>
            handleChange('codeDomaine', e.target.value)
          }
          placeholder="Code"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          value={formData.libelleDomaine || ''}
          onChange={(e) =>
            handleChange('libelleDomaine', e.target.value)
          }
          placeholder="Libellé"
          className="input input-bordered input-sm w-full"
        />
      </div>
    </div>

    {/* Domaine AR */}
    <div>
      <label
        className="label-text text-xs text-base-content/70 block text-right"
        dir="rtl"
      >
        الميدان (AR)
      </label>
      <input
        type="text"
        dir="rtl"
        value={formData.libelleDomaineAr || ''}
        onChange={(e) =>
          handleChange('libelleDomaineAr', e.target.value)
        }
        className="input input-bordered input-sm w-full text-right mt-1"
      />
    </div>

    {/* Structure */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Structure
      </label>
      <input
        type="text"
        value={formData.structure || ''}
        onChange={(e) =>
          handleChange('structure', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Filière complète */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Code / Libellé Filière
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.codeFiliere || ''}
          onChange={(e) =>
            handleChange('codeFiliere', e.target.value)
          }
          placeholder="Code"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          value={formData.libelleFiliere || ''}
          onChange={(e) =>
            handleChange('libelleFiliere', e.target.value)
          }
          placeholder="Libellé"
          className="input input-bordered input-sm w-full"
        />
      </div>
    </div>

    {/* Filière AR complète */}
    <div>
      <label
        className="label-text text-xs text-base-content/70 block text-right"
        dir="rtl"
      >
        الشعبة - الاسم الكامل (AR)
      </label>
      <input
        type="text"
        dir="rtl"
        value={formData.libelleFiliereAr || ''}
        onChange={(e) =>
          handleChange('libelleFiliereAr', e.target.value)
        }
        className="input input-bordered input-sm w-full text-right mt-1"
      />
    </div>

    {/* Code niveau */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Code Niveau
      </label>
      <input
        type="text"
        value={formData.codeNiveau || ''}
        onChange={(e) =>
          handleChange('codeNiveau', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

    {/* Cycle */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Code / Libellé Cycle
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input
          type="text"
          value={formData.codeCycle || ''}
          onChange={(e) =>
            handleChange('codeCycle', e.target.value)
          }
          placeholder="Code"
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          value={formData.libelleCycle || ''}
          onChange={(e) =>
            handleChange('libelleCycle', e.target.value)
          }
          placeholder="Libellé"
          className="input input-bordered input-sm w-full"
        />
      </div>
    </div>

    {/* Situation inscription */}
    <div>
      <label className="label-text text-xs text-base-content/70">
        Situation Inscription
      </label>
      <input
        type="text"
        value={formData.sitIns || ''}
        onChange={(e) =>
          handleChange('sitIns', e.target.value)
        }
        className="input input-bordered input-sm w-full mt-1"
      />
    </div>

  </div>
</div>


{/* 5. STATUTS / OPTIONS */}
<div className="space-y-3">
  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-base-200 pb-1">
    Statut & Paiements
  </h4>

  <div className="flex flex-wrap gap-6 pt-1">

    {/* Inscription */}
    <label className="cursor-pointer flex items-center gap-2">
      <input
        type="checkbox"
        checked={formData.fraisInscriptionPaye || false}
        onChange={(e) =>
          handleChange(
            'fraisInscriptionPaye',
            e.target.checked
          )
        }
        className="checkbox checkbox-primary checkbox-sm"
      />
      <span className="label-text text-xs font-medium">
        Inscription payée
      </span>
    </label>

    {/* Transport */}
    <label className="cursor-pointer flex items-center gap-2">
      <input
        type="checkbox"
        checked={formData.fraisTransportPaye || false}
        onChange={(e) =>
          handleChange(
            'fraisTransportPaye',
            e.target.checked
          )
        }
        className="checkbox checkbox-primary checkbox-sm"
      />
      <span className="label-text text-xs font-medium">
        Transport payé
      </span>
    </label>

    {/* Redoublant */}
    <label className="cursor-pointer flex items-center gap-2">
      <input
        type="checkbox"
        checked={formData.redoublant || false}
        onChange={(e) =>
          handleChange('redoublant', e.target.checked)
        }
        className="checkbox checkbox-warning checkbox-sm"
      />
      <span className="label-text text-xs font-medium">
        Redoublant
      </span>
    </label>

    {/* Transfert */}
    <label className="cursor-pointer flex items-center gap-2">
      <input
        type="checkbox"
        checked={formData.transfert || false}
        onChange={(e) =>
          handleChange('transfert', e.target.checked)
        }
        className="checkbox checkbox-info checkbox-sm"
      />
      <span className="label-text text-xs font-medium">
        Transfert
      </span>
    </label>

  </div>
</div>

      {/* ACTIONS EN BAS DE MODALE */}
      <div className="flex justify-end gap-2 pt-4 border-t border-base-200 sticky bottom-0 bg-base-100 z-10">
        <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost">
          Annuler
        </button>
        <button type="submit" disabled={saving || uploadingMedia} className="btn btn-sm btn-primary min-w-28">
          {saving ? <span className="loading loading-spinner loading-xs"></span> : '💾 Enregistrer'}
        </button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// CONTENU DE LA PAGE PRINCIPALE
// ----------------------------------------------------------------------
function HomeContent() {
  const searchParams = useSearchParams();
  const filiereQuery = searchParams.get('filiere') || '';
  const searchQuery = searchParams.get('q') || '';

  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState(filiereQuery);
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedSpecialite, setSelectedSpecialite] = useState('');
  const [message, setMessage] = useState('');

  // Sélection multiple (cases à cocher)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Panneau latéral : détail étudiant + badge recto/verso
  const [selectedBadgeEtudiant, setSelectedBadgeEtudiant] = useState<Etudiant | null>(null);
  const [badgeSide, setBadgeSide] = useState<'recto' | 'verso'>('recto');

  // Modale Modification Étudiant
  const [selectedEditEtudiant, setSelectedEditEtudiant] = useState<Etudiant | null>(null);

  useEffect(() => {
    if (filiereQuery !== undefined) {
      setSelectedFiliere(filiereQuery);
    }
  }, [filiereQuery]);

  useEffect(() => {
    if (searchQuery) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  const fetchEtudiants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/etudiants');
      const data = await res.json();
      if (Array.isArray(data)) setEtudiants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtudiants();
  }, []);

  const filiereOptions = useMemo(() => Array.from(new Set(etudiants.map((e) => e.filiere).filter(Boolean) as string[])).sort(), [etudiants]);
  const niveauOptions = useMemo(() => Array.from(new Set(etudiants.map((e) => e.niveau).filter(Boolean) as string[])).sort(), [etudiants]);
  const specialiteOptions = useMemo(() => Array.from(new Set(etudiants.map((e) => e.specialite).filter(Boolean) as string[])).sort(), [etudiants]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok) {
        setMessage(`Succès : ${result.count} étudiants importés.`);
        fetchEtudiants();
      } else {
        setMessage(`Erreur : ${result.error}`);
      }
    } catch {
      setMessage("Erreur lors de l'envoi.");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Vider toute la base de données ?')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/etudiants', { method: 'DELETE' });
      if (res.ok) {
        setMessage('Base de données vidée.');
        setEtudiants([]);
      }
    } catch {
      setMessage('Erreur lors de la suppression.');
    } finally {
      setClearing(false);
    }
  };

  const filteredEtudiants = etudiants.filter((e) => {
    const matchSearch = `${e.nom} ${e.prenom} ${e.matEtudiant} ${e.nomAr || ''} ${e.prenomAr || ''} ${e.filiere || ''} ${e.specialite || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchSearch && (!selectedFiliere || e.filiere === selectedFiliere) && (!selectedNiveau || e.niveau === selectedNiveau) && (!selectedSpecialite || e.specialite === selectedSpecialite);
  });

  // Réinitialise la page courante quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [search, selectedFiliere, selectedNiveau, selectedSpecialite, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredEtudiants.length / pageSize));
  const paginatedEtudiants = filteredEtudiants.slice((page - 1) * pageSize, page * pageSize);

  const allVisibleSelected = paginatedEtudiants.length > 0 && paginatedEtudiants.every((e) => selectedIds.has(e.matEtudiant));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        paginatedEtudiants.forEach((e) => next.delete(e.matEtudiant));
      } else {
        paginatedEtudiants.forEach((e) => next.add(e.matEtudiant));
      }
      return next;
    });
  };

  const toggleSelectOne = (mat: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mat)) next.delete(mat);
      else next.add(mat);
      return next;
    });
  };

  const openBadgePanel = (e: Etudiant) => {
    setBadgeSide('recto');
    setSelectedBadgeEtudiant(e);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      {/* Colonne principale */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Header & Actions */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="card-title text-2xl font-bold flex items-center gap-2">
                <span>👥</span> Liste des étudiants
              </h1>
              <p className="text-sm text-base-content/70">
                Gérez les listes, importez les fichiers CSV, intégrez les badges PDF et consultez les photos de profil.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/import-badges" className="btn btn-secondary btn-outline btn-sm">
                🎴 Importer Badges (PDF)
              </Link>

              <button
                onClick={handleClearDatabase}
                disabled={clearing || uploading || etudiants.length === 0}
                className="btn btn-error btn-outline btn-sm"
              >
                {clearing ? <span className="loading loading-spinner"></span> : '🗑️ Vider la base'}
              </button>

              <label className={`btn btn-primary btn-sm ${uploading ? 'btn-disabled' : ''}`}>
                {uploading ? <span className="loading loading-spinner"></span> : '📥 Importer PROGRES (CSV)'}
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('Succès') ? 'alert-success' : 'alert-error'} shadow-sm`}>
            <span>{message}</span>
          </div>
        )}

        {/* Zone Filtres */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label label-text font-semibold">Recherche</label>
                <input
                  type="text"
                  placeholder="Nom, matricule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>

              <div className="form-control">
                <label className="label label-text font-semibold">Filière</label>
                <select
                  value={selectedFiliere}
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">Toutes les filières</option>
                  {filiereOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text font-semibold">Niveau</label>
                <select
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">Toutes les années</option>
                  {niveauOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text font-semibold">Spécialité</label>
                <select
                  value={selectedSpecialite}
                  onChange={(e) => setSelectedSpecialite(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">Toutes</option>
                  {specialiteOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-base-content/70 pt-2 border-t border-base-200">
              <span>
                Total : <strong>{filteredEtudiants.length}</strong> étudiant{filteredEtudiants.length > 1 ? 's' : ''}
                {selectedIds.size > 0 && (
                  <span className="ml-2 badge badge-primary badge-sm">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
                )}
              </span>
              {(search || selectedFiliere || selectedNiveau || selectedSpecialite) && (
                <button
                  onClick={() => { setSearch(''); setSelectedFiliere(''); setSelectedNiveau(''); setSelectedSpecialite(''); }}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tableau Étudiants */}
        <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>N°</th>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th className="text-right">الاسم واللقب</th>
                  <th>Niveau</th>
                  <th>Filière / Spécialité</th>
                  <th>Frais</th>
                  <th>Badge</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </td>
                  </tr>
                ) : paginatedEtudiants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-base-content/60">
                      Aucun étudiant trouvé.
                    </td>
                  </tr>
                ) : (
                  paginatedEtudiants.map((e, idx) => (
                    <tr key={e.matEtudiant} className={selectedBadgeEtudiant?.matEtudiant === e.matEtudiant ? 'bg-primary/5' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedIds.has(e.matEtudiant)}
                          onChange={() => toggleSelectOne(e.matEtudiant)}
                        />
                      </td>
                      <td className="text-xs text-base-content/50">{(page - 1) * pageSize + idx + 1}</td>
                      <td>
                        {/* Clique sur la photo ou le nom pour ouvrir le panneau de détail */}
                        <div
                          onClick={() => openBadgePanel(e)}
                          className="flex items-center gap-3 cursor-pointer group"
                          title="Cliquer pour voir le détail et le badge"
                        >
                          <div className="avatar">
                            <div className="mask mask-squircle w-10 h-10 bg-base-200 ring ring-primary/20 ring-offset-base-100 ring-offset-1 group-hover:ring-primary transition-all">
                              <img
                                src={e.photoUrl || `/uploads/photos/${e.matEtudiant}.jpg`}
                                alt={`${e.nom} ${e.prenom}`}
                                onError={(err) => {
                                  (err.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${e.nom} ${e.prenom}`
                                  )}&background=0D8ABC&color=fff&bold=true`;
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-sm group-hover:text-primary group-hover:underline transition-all">
                              {e.nom} {e.prenom}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono font-bold text-xs">{e.matEtudiant}</td>
                      <td className="text-right font-medium" dir="rtl">{e.nomAr} {e.prenomAr}</td>
                      <td>{e.niveau || '-'}</td>
                      <td className="text-xs">
                        <div className="font-bold text-primary">{e.filiere}</div>
                        <div>{e.specialite}</div>
                      </td>
                      <td>
                        <span className={`badge badge-sm font-bold ${e.fraisInscriptionPaye ? 'badge-success' : 'badge-error'}`}>
                          {e.fraisInscriptionPaye ? 'Payé' : 'Non Payé'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => openBadgePanel(e)}
                          className="btn btn-xs btn-outline btn-primary"
                        >
                          🎴 Badge
                        </button>
                      </td>
                      <td className="flex gap-1 items-center">
                        <button
                          onClick={() => setSelectedEditEtudiant(e)}
                          className="btn btn-square btn-ghost btn-xs"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredEtudiants.length > 0 && (
            <div className="flex flex-wrap justify-between items-center gap-3 px-4 py-3 border-t border-base-200">
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  «
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === 'ellipsis' ? (
                      <button key={`e-${i}`} className="join-item btn btn-sm btn-disabled">…</button>
                    ) : (
                      <button
                        key={p}
                        className={`join-item btn btn-sm ${page === p ? 'btn-primary' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  »
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-base-content/70">
                <span>Éléments par page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="select select-bordered select-xs"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panneau latéral : Détail de l'étudiant + Badge recto/verso */}
      {selectedBadgeEtudiant && (
        <div className="w-full xl:w-[380px] shrink-0 xl:sticky xl:top-20">
          <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
            <div className="bg-primary text-primary-content px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">Détail de l'étudiant</h3>
              <button
                onClick={() => setSelectedBadgeEtudiant(null)}
                className="btn btn-xs btn-circle btn-ghost text-primary-content hover:bg-primary-focus"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Identité */}
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300">
                    <img
                      src={selectedBadgeEtudiant.photoUrl || `/uploads/photos/${selectedBadgeEtudiant.matEtudiant}.jpg`}
                      alt={selectedBadgeEtudiant.nom}
                      onError={(err) => {
                        (err.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          `${selectedBadgeEtudiant.nom} ${selectedBadgeEtudiant.prenom}`
                        )}&background=0D8ABC&color=fff&bold=true`;
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-base leading-tight">
                    {selectedBadgeEtudiant.nom} {selectedBadgeEtudiant.prenom}
                  </h4>
                  {(selectedBadgeEtudiant.nomAr || selectedBadgeEtudiant.prenomAr) && (
                    <p className="text-sm text-base-content/70" dir="rtl">
                      {selectedBadgeEtudiant.nomAr} {selectedBadgeEtudiant.prenomAr}
                    </p>
                  )}
                  <p className="text-xs font-mono text-base-content/60">
                    Matricule : {selectedBadgeEtudiant.matEtudiant}
                  </p>
                </div>
              </div>

              {/* Infos */}
              <div className="text-sm space-y-1.5 border-t border-base-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Filière</span>
                  <span className="font-medium">{selectedBadgeEtudiant.filiere || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Spécialité</span>
                  <span className="font-medium">{selectedBadgeEtudiant.specialite || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Niveau</span>
                  <span className="font-medium">{selectedBadgeEtudiant.niveau || '-'}</span>
                </div>
                {selectedBadgeEtudiant.dateNaissance && (
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Date de naissance</span>
                    <span className="font-medium">{selectedBadgeEtudiant.dateNaissance}</span>
                  </div>
                )}
                {selectedBadgeEtudiant.wilayaResidence && (
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Wilaya</span>
                    <span className="font-medium">{selectedBadgeEtudiant.wilayaResidence}</span>
                  </div>
                )}
              </div>

              {/* Aperçu du badge */}
              <div className="border-t border-base-200 pt-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                  Aperçu du badge (CR80 - 54 x 86 mm)
                </p>

                <div role="tablist" className="tabs tabs-boxed tabs-sm">
                  <button
                    role="tab"
                    className={`tab ${badgeSide === 'recto' ? 'tab-active' : ''}`}
                    onClick={() => setBadgeSide('recto')}
                  >
                    Recto
                  </button>
                  <button
                    role="tab"
                    className={`tab ${badgeSide === 'verso' ? 'tab-active' : ''}`}
                    onClick={() => setBadgeSide('verso')}
                  >
                    Verso
                  </button>
                </div>

                {badgeSide === 'recto' ? (
                  <div className="rounded-xl overflow-hidden border border-base-300 bg-gradient-to-br from-primary to-primary-focus text-primary-content aspect-[86/54] p-3 flex flex-col justify-between shadow-inner">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-90 leading-tight">
                      <span className="text-base">🎓</span>
                      <span>École Normale Supérieure de Saïda</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded ring-2 ring-primary-content/40 overflow-hidden bg-base-300">
                          <img
                            src={selectedBadgeEtudiant.photoUrl || `/uploads/photos/${selectedBadgeEtudiant.matEtudiant}.jpg`}
                            alt={selectedBadgeEtudiant.nom}
                            onError={(err) => {
                              (err.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${selectedBadgeEtudiant.nom} ${selectedBadgeEtudiant.prenom}`
                              )}&background=0D8ABC&color=fff&bold=true`;
                            }}
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {selectedBadgeEtudiant.nom} {selectedBadgeEtudiant.prenom}
                        </div>
                        <div className="text-[10px] opacity-90 truncate" dir="rtl">
                          {selectedBadgeEtudiant.nomAr} {selectedBadgeEtudiant.prenomAr}
                        </div>
                        <div className="text-[10px] opacity-80 font-mono">
                          {selectedBadgeEtudiant.matEtudiant}
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] opacity-80 flex justify-between">
                      <span>{selectedBadgeEtudiant.filiere || '-'}</span>
                      <span>{selectedBadgeEtudiant.niveau || '-'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-[86/54] p-3 flex items-center gap-3 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(selectedBadgeEtudiant.matEtudiant)}`}
                      alt="QR code"
                      className="w-16 h-16 bg-white rounded p-1 shrink-0"
                    />
                    <div className="text-[10px] leading-snug">
                      <p className="font-bold">Scannez pour vérifier l'authenticité du badge</p>
                      <p className="opacity-70 mt-1">Matricule : {selectedBadgeEtudiant.matEtudiant}</p>
                      <p className="opacity-70">ENS Saïda</p>
                    </div>
                  </div>
                )}
              </div>

              {/* PDF réel du badge (si généré côté serveur) */}
              <div className="rounded-lg border border-base-300 overflow-hidden">
                <iframe
                  src={`/uploads/badges/${selectedBadgeEtudiant.matEtudiant}.pdf#toolbar=0`}
                  className="w-full h-40 bg-base-200"
                  title={`Badge ${selectedBadgeEtudiant.matEtudiant}`}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`/uploads/badges/${selectedBadgeEtudiant.matEtudiant}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline flex-1"
                >
                  ⬇️ Télécharger PDF
                </a>
                <a
                  href={`/uploads/badges/${selectedBadgeEtudiant.matEtudiant}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary flex-1"
                >
                  🖨️ Imprimer
                </a>
                <button
                  onClick={() => setSelectedEditEtudiant(selectedBadgeEtudiant)}
                  className="btn btn-sm btn-ghost w-full"
                >
                  ✏️ Modifier les informations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : Modification Structurée (max-w-3xl) */}
      {selectedEditEtudiant && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-base-200 px-5 py-3 shrink-0 bg-base-100">
              <div>
                <h3 className="font-bold text-lg">
                  Modifier {selectedEditEtudiant.nom} {selectedEditEtudiant.prenom}
                </h3>
                <p className="text-xs font-mono text-base-content/60">
                  Matricule: {selectedEditEtudiant.matEtudiant}
                </p>
              </div>
              <button
                onClick={() => setSelectedEditEtudiant(null)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <FormulaireEditionEtudiant
                etudiant={selectedEditEtudiant}
                onSuccess={() => {
                  setSelectedEditEtudiant(null);
                  fetchEtudiants();
                  setMessage('Succès : Informations mises à jour.');
                }}
                onCancel={() => setSelectedEditEtudiant(null)}
              />
            </div>
          </div>

          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSelectedEditEtudiant(null)}>fermer</button>
          </form>
        </dialog>
      )}
    </div>
  );
}

export default function EtudiantsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
