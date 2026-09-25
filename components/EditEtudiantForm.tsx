// components/EditEtudiantForm.tsx
'use client';

import { useState, useEffect, ChangeEvent } from 'react';

export interface Etudiant {
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
  fraisTransportPaye: boolean;
  redoublant?: boolean;
  transfert?: boolean;
}

interface Props {
  initialEtudiant: Etudiant;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Petits composants réutilisables pour garder le formulaire lisible
function FieldLabel({ children, rtl }: { children: React.ReactNode; rtl?: boolean }) {
  return (
    <label className={`block text-xs text-slate-400 mb-1 ${rtl ? 'text-right' : ''}`} dir={rtl ? 'rtl' : undefined}>
      {children}
    </label>
  );
}

const inputBase =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500';

export default function EditEtudiantForm({ initialEtudiant, onSuccess, onCancel }: Props) {
  const [formData, setFormData] = useState<Partial<Etudiant>>(initialEtudiant);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [message, setMessage] = useState('');
  const [mediaTimestamp, setMediaTimestamp] = useState(Date.now());

  useEffect(() => {
    setFormData(initialEtudiant);
  }, [initialEtudiant]);

  const handleChange = (field: keyof Etudiant, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOverwritePdf = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.matEtudiant) return;

    setUploadingMedia(true);
    setMessage('');

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
          setMessage('Succès : Badge PDF remplacé !');
          setMediaTimestamp(Date.now());
        } else {
          setMessage('Erreur lors du remplacement du PDF.');
        }
        setUploadingMedia(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setMessage("Erreur lors de l'envoi.");
      setUploadingMedia(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleOverwritePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.matEtudiant) return;

    setUploadingMedia(true);
    setMessage('');

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
        setMessage('Succès : Photo mise à jour !');
        if (result.photoUrl) handleChange('photoUrl', result.photoUrl);
        setMediaTimestamp(Date.now());
      } else {
        setMessage("Erreur lors de l'envoi de la photo.");
      }
    } catch {
      setMessage('Erreur réseau.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matEtudiant) return;

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/etudiants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
      } else {
        const errorData = await res.json();
        setMessage(`Erreur : ${errorData.error || 'Échec de la mise à jour'}`);
      }
    } catch {
      setMessage('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  const initials = `${formData.prenom?.[0] || ''}${formData.nom?.[0] || ''}`.toUpperCase();

  return (
    <form onSubmit={handleSave} className="space-y-6 p-4 max-h-[85vh] overflow-y-auto bg-white rounded-2xl text-slate-800">
      {/* En-tête / Title */}
      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Modifier {formData.nom} {formData.prenom}
          </h2>
          <p className="text-xs font-mono text-slate-400">Matricule: {formData.matEtudiant}</p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
            ✕
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-medium ${message.startsWith('Succès') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {message}
        </div>
      )}

      {/* Media Box */}
      <div className="bg-slate-50/70 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-sky-600 text-white flex items-center justify-center font-semibold text-lg overflow-hidden shrink-0 border-2 border-white shadow-sm">
            {formData.photoUrl ? (
              <img
                src={formData.photoUrl}
                alt="Photo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span>{initials || 'ET'}</span>
            )}
          </div>

          <label className={`cursor-pointer px-3 py-1.5 rounded-full border border-sky-500 text-sky-600 text-xs font-medium hover:bg-sky-50 flex items-center gap-1.5 transition ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
            📷 Changer photo
            <input type="file" accept="image/*" onChange={handleOverwritePhoto} className="hidden" disabled={uploadingMedia} />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/uploads/badges/${formData.matEtudiant}.pdf?t=${mediaTimestamp}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
          >
            👁️ Voir PDF
          </a>
          <label className={`cursor-pointer px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 transition shadow-sm ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
            📑 Remplacer PDF
            <input type="file" accept=".pdf" onChange={handleOverwritePdf} className="hidden" disabled={uploadingMedia} />
          </label>
        </div>
      </div>

      {/* 1. IDENTITÉ */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-blue-600 tracking-wider uppercase border-b border-slate-100 pb-1">
          Identité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Nom (FR)</FieldLabel>
            <input type="text" value={formData.nom || ''} onChange={(e) => handleChange('nom', e.target.value)} className={inputBase} required />
          </div>
          <div>
            <FieldLabel rtl>اللقب (AR)</FieldLabel>
            <input type="text" dir="rtl" value={formData.nomAr || ''} onChange={(e) => handleChange('nomAr', e.target.value)} className={`${inputBase} text-right`} />
          </div>

          <div>
            <FieldLabel>Prénom (FR)</FieldLabel>
            <input type="text" value={formData.prenom || ''} onChange={(e) => handleChange('prenom', e.target.value)} className={inputBase} required />
          </div>
          <div>
            <FieldLabel rtl>الاسم (AR)</FieldLabel>
            <input type="text" dir="rtl" value={formData.prenomAr || ''} onChange={(e) => handleChange('prenomAr', e.target.value)} className={`${inputBase} text-right`} />
          </div>

          <div>
            <FieldLabel>Civilité</FieldLabel>
            <select value={formData.civilite || ''} onChange={(e) => handleChange('civilite', e.target.value)} className={`${inputBase} bg-white`}>
              <option value="">-- Civilité --</option>
              <option value="M.">M.</option>
              <option value="Mlle">Mlle</option>
              <option value="Mme">Mme</option>
            </select>
          </div>
          <div>
            <FieldLabel>Sexe</FieldLabel>
            <select value={formData.sexe || ''} onChange={(e) => handleChange('sexe', e.target.value)} className={`${inputBase} bg-white`}>
              <option value="">-- Sexe --</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>

          <div>
            <FieldLabel>Date de Naissance</FieldLabel>
            <input type="text" value={formData.dateNaissance || ''} onChange={(e) => handleChange('dateNaissance', e.target.value)} placeholder="JJ/MM/AAAA" className={inputBase} />
          </div>
          <div>
            <FieldLabel>Téléphone</FieldLabel>
            <input type="text" value={formData.telephone || ''} onChange={(e) => handleChange('telephone', e.target.value)} className={inputBase} />
          </div>

          <div>
            <FieldLabel>Lieu de Naissance (FR / AR)</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.lieuNaissance || ''} onChange={(e) => handleChange('lieuNaissance', e.target.value)} placeholder="FR" className={inputBase} />
              <input type="text" dir="rtl" value={formData.lieuNaissanceAr || ''} onChange={(e) => handleChange('lieuNaissanceAr', e.target.value)} placeholder="مكان الميلاد" className={`${inputBase} text-right`} />
            </div>
          </div>
          <div>
            <FieldLabel>Wilaya / Ville de Naissance</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.wilayaNaissance || ''} onChange={(e) => handleChange('wilayaNaissance', e.target.value)} placeholder="Wilaya" className={inputBase} />
              <input type="text" value={formData.villeNaissance || ''} onChange={(e) => handleChange('villeNaissance', e.target.value)} placeholder="Ville" className={inputBase} />
            </div>
          </div>

          <div>
            <FieldLabel>Adresse</FieldLabel>
            <input type="text" value={formData.adresse || ''} onChange={(e) => handleChange('adresse', e.target.value)} className={inputBase} />
          </div>
          <div>
            <FieldLabel>Wilaya de Résidence</FieldLabel>
            <input type="text" value={formData.wilayaResidence || ''} onChange={(e) => handleChange('wilayaResidence', e.target.value)} className={inputBase} />
          </div>

          <div>
            <FieldLabel>Situation Familiale</FieldLabel>
            <select value={formData.situationFamiliale || ''} onChange={(e) => handleChange('situationFamiliale', e.target.value)} className={`${inputBase} bg-white`}>
              <option value="">-- Situation --</option>
              <option value="Célibataire">Célibataire</option>
              <option value="Marié(e)">Marié(e)</option>
              <option value="Divorcé(e)">Divorcé(e)</option>
              <option value="Veuf/Veuve">Veuf/Veuve</option>
            </select>
          </div>
          <div>
            <FieldLabel>Nationalité (FR / AR)</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.nationalite || 'Algerienne'} onChange={(e) => handleChange('nationalite', e.target.value)} placeholder="FR" className={inputBase} />
              <input type="text" dir="rtl" value={formData.nationaliteAr || ''} onChange={(e) => handleChange('nationaliteAr', e.target.value)} placeholder="AR" className={`${inputBase} text-right`} />
            </div>
          </div>

          <div>
            <FieldLabel>NIN / Carte RFID</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.nin || ''} onChange={(e) => handleChange('nin', e.target.value)} placeholder="NIN" className={inputBase} />
              <input type="text" value={formData.carteRfid || ''} onChange={(e) => handleChange('carteRfid', e.target.value)} placeholder="RFID" className={`${inputBase} font-mono`} />
            </div>
          </div>
          <div>
            <FieldLabel>Groupe Sanguin</FieldLabel>
            <select value={formData.groupeSanguin || ''} onChange={(e) => handleChange('groupeSanguin', e.target.value)} className={`${inputBase} bg-white`}>
              <option value="">Sang</option>
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

      {/* 2. FILIATION & PARENTS */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-blue-600 tracking-wider uppercase border-b border-slate-100 pb-1">
          Filiation & Parents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Prénom Père (FR / AR)</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.prenomPere || ''} onChange={(e) => handleChange('prenomPere', e.target.value)} placeholder="FR" className={inputBase} />
              <input type="text" dir="rtl" value={formData.prenomPereAr || ''} onChange={(e) => handleChange('prenomPereAr', e.target.value)} placeholder="اسم الأب" className={`${inputBase} text-right`} />
            </div>
          </div>
          <div>
            <FieldLabel>Nom Mère (FR / AR)</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.nomMere || ''} onChange={(e) => handleChange('nomMere', e.target.value)} placeholder="FR" className={inputBase} />
              <input type="text" dir="rtl" value={formData.nomMereAr || ''} onChange={(e) => handleChange('nomMereAr', e.target.value)} placeholder="لقب الأم" className={`${inputBase} text-right`} />
            </div>
          </div>
          <div>
            <FieldLabel>Prénom Mère (FR / AR)</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.prenomMere || ''} onChange={(e) => handleChange('prenomMere', e.target.value)} placeholder="FR" className={inputBase} />
              <input type="text" dir="rtl" value={formData.prenomMereAr || ''} onChange={(e) => handleChange('prenomMereAr', e.target.value)} placeholder="اسم الأم" className={`${inputBase} text-right`} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BACCALAURÉAT & ORIGINE */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-blue-600 tracking-wider uppercase border-b border-slate-100 pb-1">
          Baccalauréat & Origine
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <FieldLabel>Matricule BAC / Année</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.matBac || ''} onChange={(e) => handleChange('matBac', e.target.value)} placeholder="Mat BAC" className={inputBase} />
              <input type="number" value={formData.anneeBac || ''} onChange={(e) => handleChange('anneeBac', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Année" className={inputBase} />
            </div>
          </div>
          <div>
            <FieldLabel>Moyenne BAC</FieldLabel>
            <input type="number" step="0.01" value={formData.moyenneBac || ''} onChange={(e) => handleChange('moyenneBac', e.target.value ? parseFloat(e.target.value) : undefined)} className={inputBase} />
          </div>
          <div>
            <FieldLabel>Série BAC</FieldLabel>
            <input type="text" value={formData.serieBac || ''} onChange={(e) => handleChange('serieBac', e.target.value)} className={inputBase} />
          </div>

          <div>
            <FieldLabel>Libellé BAC</FieldLabel>
            <input type="text" value={formData.libelleBac || ''} onChange={(e) => handleChange('libelleBac', e.target.value)} className={inputBase} />
          </div>
          <div>
            <FieldLabel>Wilaya BAC</FieldLabel>
            <input type="text" value={formData.wilayaBac || ''} onChange={(e) => handleChange('wilayaBac', e.target.value)} className={inputBase} />
          </div>
          <div>
            <FieldLabel>Date Validation Inscription</FieldLabel>
            <input type="text" value={formData.dateValidationInscription || ''} onChange={(e) => handleChange('dateValidationInscription', e.target.value)} placeholder="JJ/MM/AAAA" className={inputBase} />
          </div>
        </div>
      </div>

      {/* 4. PARCOURS ACADÉMIQUE */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-blue-600 tracking-wider uppercase border-b border-slate-100 pb-1">
          Parcours Académique
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <FieldLabel>Niveau</FieldLabel>
            <input type="text" value={formData.niveau || ''} onChange={(e) => handleChange('niveau', e.target.value)} className={inputBase} />
          </div>
          <div>
            <FieldLabel>Filière</FieldLabel>
            <input type="text" value={formData.filiere || ''} onChange={(e) => handleChange('filiere', e.target.value)} className={inputBase} />
          </div>
          <div>
            <FieldLabel>Spécialité</FieldLabel>
            <input type="text" value={formData.specialite || ''} onChange={(e) => handleChange('specialite', e.target.value)} className={inputBase} />
          </div>

          <div>
            <FieldLabel rtl>المستوى (AR)</FieldLabel>
            <input type="text" dir="rtl" value={formData.niveauAr || ''} onChange={(e) => handleChange('niveauAr', e.target.value)} className={`${inputBase} text-right`} />
          </div>
          <div>
            <FieldLabel rtl>الشعبة (AR)</FieldLabel>
            <input type="text" dir="rtl" value={formData.filiereAr || ''} onChange={(e) => handleChange('filiereAr', e.target.value)} className={`${inputBase} text-right`} />
          </div>
          <div>
            <FieldLabel rtl>التخصص (AR)</FieldLabel>
            <input type="text" dir="rtl" value={formData.specialiteAr || ''} onChange={(e) => handleChange('specialiteAr', e.target.value)} className={`${inputBase} text-right`} />
          </div>

          <div>
            <FieldLabel>Code / Libellé Domaine</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.codeDomaine || ''} onChange={(e) => handleChange('codeDomaine', e.target.value)} placeholder="Code" className={inputBase} />
              <input type="text" value={formData.libelleDomaine || ''} onChange={(e) => handleChange('libelleDomaine', e.target.value)} placeholder="Libellé" className={inputBase} />
            </div>
          </div>
          <div>
            <FieldLabel rtl>الميدان (AR)</FieldLabel>
            <input type="text" dir="rtl" value={formData.libelleDomaineAr || ''} onChange={(e) => handleChange('libelleDomaineAr', e.target.value)} className={`${inputBase} text-right`} />
          </div>
          <div>
            <FieldLabel>Structure</FieldLabel>
            <input type="text" value={formData.structure || ''} onChange={(e) => handleChange('structure', e.target.value)} className={inputBase} />
          </div>

          <div>
            <FieldLabel>Code / Libellé Filière</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.codeFiliere || ''} onChange={(e) => handleChange('codeFiliere', e.target.value)} placeholder="Code" className={inputBase} />
              <input type="text" value={formData.libelleFiliere || ''} onChange={(e) => handleChange('libelleFiliere', e.target.value)} placeholder="Libellé" className={inputBase} />
            </div>
          </div>
          <div>
            <FieldLabel rtl>الشعبة - الاسم الكامل (AR)</FieldLabel>
            <input type="text" dir="rtl" value={formData.libelleFiliereAr || ''} onChange={(e) => handleChange('libelleFiliereAr', e.target.value)} className={`${inputBase} text-right`} />
          </div>
          <div>
            <FieldLabel>Code Niveau</FieldLabel>
            <input type="text" value={formData.codeNiveau || ''} onChange={(e) => handleChange('codeNiveau', e.target.value)} className={inputBase} />
          </div>

          <div>
            <FieldLabel>Code / Libellé Cycle</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={formData.codeCycle || ''} onChange={(e) => handleChange('codeCycle', e.target.value)} placeholder="Code" className={inputBase} />
              <input type="text" value={formData.libelleCycle || ''} onChange={(e) => handleChange('libelleCycle', e.target.value)} placeholder="Libellé" className={inputBase} />
            </div>
          </div>
          <div>
            <FieldLabel>Situation Inscription (sitIns)</FieldLabel>
            <input type="text" value={formData.sitIns || ''} onChange={(e) => handleChange('sitIns', e.target.value)} className={inputBase} />
          </div>
        </div>
      </div>

      {/* 5. STATUT & PAIEMENTS */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-blue-600 tracking-wider uppercase border-b border-slate-100 pb-1">
          Statut & Paiements
        </h3>
        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={formData.fraisInscriptionPaye || false}
              onChange={(e) => handleChange('fraisInscriptionPaye', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            Frais d'inscription payés
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={formData.fraisTransportPaye || false}
              onChange={(e) => handleChange('fraisTransportPaye', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            Frais de transport payés
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={formData.redoublant || false}
              onChange={(e) => handleChange('redoublant', e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            Redoublant
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={formData.transfert || false}
              onChange={(e) => handleChange('transfert', e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            Transfert
          </label>
        </div>
      </div>

      {/* Actions / Buttons */}
      <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl transition"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={saving || uploadingMedia}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            '💾 Enregistrer'
          )}
        </button>
      </div>
    </form>
  );
}