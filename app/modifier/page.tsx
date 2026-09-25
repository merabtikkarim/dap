// app/modifier/page.tsx

'use client';

import { useState, useEffect, useMemo, useCallback, memo, Suspense, ChangeEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Etudiant {
  // Identifiants
  matEtudiant: string;
  nin?: string;
  matBac?: string;
  anneeBac?: number;
  carteRfid?: string;

  // Infos personnelles FR
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

  // Infos personnelles AR
  nomAr?: string;
  prenomAr?: string;
  lieuNaissanceAr?: string;
  nationaliteAr?: string;

  // Parentales
  prenomPere?: string;
  prenomPereAr?: string;
  nomMere?: string;
  nomMereAr?: string;
  prenomMere?: string;
  prenomMereAr?: string;

  // Origine & Bac
  wilayaNaissance?: string;
  wilayaBac?: string;
  wilayaResidence?: string;
  villeNaissance?: string;
  serieBac?: string;
  libelleBac?: string;
  moyenneBac?: number;

  // Affectation & Inscription
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

  // Champs structurés
  niveau?: string;
  niveauAr?: string;
  filiere?: string;
  filiereAr?: string;
  specialite?: string;
  specialiteAr?: string;

  // Statut & Frais
  sitIns?: string;
  fraisInscriptionPaye: boolean;
  fraisTransportPaye: boolean;
  redoublant?: boolean;
  transfert?: boolean;
}

type FieldKey = keyof Etudiant;
type ChangeHandler = (field: FieldKey, value: any) => void;

// ----------------------------------------------------------------------
// Helpers de parsing stables (références de module => ne cassent jamais
// la mémoïsation des composants qui les reçoivent en props).
// ----------------------------------------------------------------------
const identityParse = (raw: string) => raw;
const parseIntOrUndefined = (raw: string) => (raw === '' ? undefined : parseInt(raw, 10));
const parseFloatOrUndefined = (raw: string) => (raw === '' ? undefined : parseFloat(raw));

// Options de select : déclarées au niveau module => référence stable,
// donc aucun re-render inutile des <SelectField> qui les utilisent.
const CIVILITE_OPTIONS = [
  { value: 'M.', label: 'M.' },
  { value: 'Mlle', label: 'Mlle' },
  { value: 'Mme', label: 'Mme' },
];
const SEXE_OPTIONS = [
  { value: 'M', label: 'Masculin (M)' },
  { value: 'F', label: 'Féminin (F)' },
];
const GROUPE_SANGUIN_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

// ----------------------------------------------------------------------
// Composants de champ mémoïsés
// ----------------------------------------------------------------------
interface FieldProps {
  field: FieldKey;
  label: string;
  value: any;
  onChange: ChangeHandler;
  type?: 'text' | 'number';
  parse?: (raw: string) => any;
  dir?: 'rtl';
  required?: boolean;
  disabled?: boolean;
  mono?: boolean;
  step?: string;
  min?: string | number;
  max?: string | number;
  placeholder?: string;
  wrapperClassName?: string;
  inputClassName?: string;
}

const Field = memo(function Field({
  field,
  label,
  value,
  onChange,
  type = 'text',
  parse = identityParse,
  dir,
  required,
  disabled,
  mono,
  step,
  min,
  max,
  placeholder,
  wrapperClassName,
  inputClassName,
}: FieldProps) {
  return (
    <div className={`form-control ${wrapperClassName || ''}`}>
      <label className={`label label-text font-medium ${dir === 'rtl' ? 'text-right' : ''}`} dir={dir}>
        {label}
      </label>
      <input
        type={type}
        dir={dir}
        required={required}
        disabled={disabled}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(field, parse(e.target.value))}
        className={`input input-bordered ${dir === 'rtl' ? 'text-right font-semibold' : ''} ${mono ? 'font-mono' : ''} ${
          disabled ? 'bg-base-200 font-bold' : ''
        } ${inputClassName || ''}`}
      />
    </div>
  );
});

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  field: FieldKey;
  label: string;
  value: any;
  onChange: ChangeHandler;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

const SelectField = memo(function SelectField({
  field,
  label,
  value,
  onChange,
  options,
  placeholder = '-- Choisir --',
  wrapperClassName,
}: SelectFieldProps) {
  return (
    <div className={`form-control ${wrapperClassName || ''}`}>
      <label className="label label-text font-medium">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(field, e.target.value)}
        className="select select-bordered"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
});

interface CodeLibelleFieldProps {
  label: string;
  codeField: FieldKey;
  libelleField: FieldKey;
  codeValue: any;
  libelleValue: any;
  onChange: ChangeHandler;
  libellePlaceholder: string;
}

const CodeLibelleField = memo(function CodeLibelleField({
  label,
  codeField,
  libelleField,
  codeValue,
  libelleValue,
  onChange,
  libellePlaceholder,
}: CodeLibelleFieldProps) {
  return (
    <div className="form-control">
      <label className="label label-text font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Code"
          value={codeValue || ''}
          onChange={(e) => onChange(codeField, e.target.value)}
          className="input input-bordered w-24 font-mono text-center"
        />
        <input
          type="text"
          placeholder={libellePlaceholder}
          value={libelleValue || ''}
          onChange={(e) => onChange(libelleField, e.target.value)}
          className="input input-bordered flex-1"
        />
      </div>
    </div>
  );
});

interface CheckboxFieldProps {
  field: FieldKey;
  label: string;
  value: boolean | undefined;
  onChange: ChangeHandler;
  colorClass?: string;
}

const CheckboxField = memo(function CheckboxField({
  field,
  label,
  value,
  onChange,
  colorClass = 'checkbox-primary',
}: CheckboxFieldProps) {
  return (
    <label className="label cursor-pointer bg-base-200/50 p-3 rounded-lg border border-base-300">
      <span className="label-text font-bold">{label} :</span>
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(field, e.target.checked)}
        className={`checkbox ${colorClass}`}
      />
    </label>
  );
});

// ----------------------------------------------------------------------
// Contenu principal
// ----------------------------------------------------------------------
function ModifierEtudiantContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMatricule = searchParams.get('matricule') || '';

  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedMatricule, setSelectedMatricule] = useState(initialMatricule);
  const [formData, setFormData] = useState<Partial<Etudiant>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [message, setMessage] = useState('');

  // Cache buster pour recharger dynamiquement l'image et le PDF après remplacement
  const [mediaTimestamp, setMediaTimestamp] = useState(Date.now());

  // Charger tous les étudiants pour la liste (annulable + protège contre les
  // mises à jour d'état après démontage du composant).
  useEffect(() => {
    const controller = new AbortController();

    setLoadingList(true);
    fetch('/api/etudiants', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setEtudiants(data);
        if (initialMatricule) {
          const found = data.find((e) => e.matEtudiant === initialMatricule);
          if (found) setFormData(found);
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      })
      .finally(() => setLoadingList(false));

    return () => controller.abort();
  }, [initialMatricule]);

  // Liste filtrée côté client (utile dès que la base contient beaucoup d'étudiants)
  const filteredEtudiants = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return etudiants;
    return etudiants.filter((e) =>
      `${e.matEtudiant} ${e.nom} ${e.prenom} ${e.filiere || ''} ${e.libelleFiliere || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [etudiants, studentSearch]);

  // Gestion du retour / fermeture selon le contexte (iframe ou accès direct)
  const closeModalOrGoBack = useCallback(
    (action: 'close' | 'saved' = 'close') => {
      if (typeof window !== 'undefined' && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'CLOSE_MODAL',
            action,
            matricule: formData.matEtudiant,
            student: formData,
          },
          '*'
        );
      } else {
        router.push('/etudiants');
      }
    },
    [formData, router]
  );

  // Sélectionner un étudiant dans la liste déroulante
  const handleSelectEtudiant = useCallback(
    (mat: string) => {
      setSelectedMatricule(mat);
      setMessage('');
      const found = etudiants.find((e) => e.matEtudiant === mat);
      setFormData(found ? { ...found } : {});
    },
    [etudiants]
  );

  // Mise à jour fonctionnelle => référence STABLE (deps []). C'est ce qui
  // permet aux <Field>/<SelectField> mémoïsés de ne re-render que lorsque
  // LEUR propre valeur change, et non à chaque frappe dans un autre champ.
  const handleChange = useCallback<ChangeHandler>((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Écraser & Téléverser un nouveau Badge PDF
  const handleOverwritePdf = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const input = e.target;
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

          const contentType = res.headers.get('content-type');
          if (res.ok && contentType?.includes('application/json')) {
            setMessage('Succès : Badge PDF remplacé et écrasé avec succès !');
            setMediaTimestamp(Date.now());
          } else {
            const errData = contentType?.includes('application/json') ? await res.json() : null;
            setMessage(`Erreur (${res.status}) : ${errData?.error || 'Route API introuvable ou erreur serveur'}`);
          }
          setUploadingMedia(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error(error);
        setMessage('Erreur lors du téléversement du fichier PDF.');
        setUploadingMedia(false);
      } finally {
        input.value = '';
      }
    },
    [formData.matEtudiant]
  );

  // Écraser & Téléverser une nouvelle Photo de profil
  const handleOverwritePhoto = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const input = e.target;
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

        const contentType = res.headers.get('content-type');
        if (res.ok && contentType?.includes('application/json')) {
          const result = await res.json();
          setMessage('Succès : Photo de profil mise à jour et écrasée !');
          if (result.photoUrl) {
            handleChange('photoUrl', result.photoUrl);
          }
          setMediaTimestamp(Date.now());
        } else {
          const errData = contentType?.includes('application/json') ? await res.json() : null;
          setMessage(`Erreur (${res.status}) : ${errData?.error || 'Route API introuvable ou erreur serveur'}`);
        }
      } catch (error) {
        console.error(error);
        setMessage('Erreur réseau lors de l’envoi de la photo.');
      } finally {
        setUploadingMedia(false);
        input.value = '';
      }
    },
    [formData.matEtudiant, handleChange]
  );

  // Soumission du formulaire
  const handleSave = useCallback(
    async (e: React.FormEvent) => {
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
          setMessage('Succès : Étudiant mis à jour ! Fermeture...');
          setTimeout(() => {
            closeModalOrGoBack('saved');
          }, 500);
        } else {
          const errorData = await res.json();
          setMessage(`Erreur : ${errorData.error || 'Échec de la mise à jour'}`);
          setSaving(false);
        }
      } catch {
        setMessage('Erreur réseau lors de la mise à jour.');
        setSaving(false);
      }
    },
    [formData, closeModalOrGoBack]
  );

  const photoSrc =
    formData.photoUrl || `/uploads/photos/${formData.matEtudiant}.jpg?t=${mediaTimestamp}`;
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${formData.nom || ''} ${formData.prenom || ''}`
  )}&background=0D8ABC&color=fff&bold=true`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 p-4">
      {/* Header & Sélection */}
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body">
          <div className="flex justify-between items-center border-b border-base-200 pb-3">
            <div>
              <h1 className="card-title text-2xl font-bold">✏️ Modification d&apos;un Étudiant</h1>
              <p className="text-sm text-base-content/70">
                Mettez à jour le dossier complet, la photo et le badge PDF de l&apos;étudiant.
              </p>
            </div>
            <button onClick={() => closeModalOrGoBack('close')} className="btn btn-outline btn-sm" type="button">
              ⬅️ Fermer / Retour
            </button>
          </div>

          <div className="form-control mt-4 space-y-2">
            <label className="label label-text font-semibold">Rechercher / Sélectionner un étudiant :</label>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Filtrer par nom, matricule, filière..."
              className="input input-bordered w-full input-sm"
              disabled={loadingList}
            />
            <select
              value={selectedMatricule}
              onChange={(e) => handleSelectEtudiant(e.target.value)}
              className="select select-bordered w-full"
              disabled={loadingList}
            >
              <option value="">
                {loadingList ? 'Chargement des étudiants...' : '-- Choisir un étudiant dans la liste --'}
              </option>
              {filteredEtudiants.map((e) => (
                <option key={e.matEtudiant} value={e.matEtudiant}>
                  {e.matEtudiant} - {e.nom} {e.prenom} ({e.filiere || e.libelleFiliere || 'SANS FILIERE'})
                </option>
              ))}
            </select>
            {!loadingList && studentSearch && (
              <p className="text-xs text-base-content/60">
                {filteredEtudiants.length} résultat{filteredEtudiants.length > 1 ? 's' : ''} sur {etudiants.length}
              </p>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('Succès') ? 'alert-success' : 'alert-error'} shadow-sm`}>
          <span>{message}</span>
        </div>
      )}

      {selectedMatricule && formData.matEtudiant && (
        <div className="space-y-6">
          {/* SECTION : Photo de profil & Badge PDF */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="text-lg font-bold border-b border-base-200 pb-2 text-primary flex items-center gap-2">
                🖼️ Photo de Profil & Badge PDF
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-center">
                {/* 1. Bloc Photo */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-base-200/50 rounded-lg border border-base-200">
                  <div className="avatar">
                    <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300">
                      <img
                        src={photoSrc}
                        alt={`${formData.nom} ${formData.prenom}`}
                        loading="lazy"
                        onError={(err) => {
                          (err.currentTarget as HTMLImageElement).src = avatarFallback;
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <h3 className="font-bold text-sm">Photo d&apos;identité</h3>
                    <p className="text-xs text-base-content/60">
                      Formats acceptés : JPG, PNG. Fichier enregistré sous{' '}
                      <code className="text-xs font-mono">/uploads/photos/{formData.matEtudiant}.jpg</code>.
                    </p>
                    <label
                      className={`btn btn-sm btn-outline btn-primary w-full sm:w-auto ${
                        uploadingMedia ? 'btn-disabled' : ''
                      }`}
                    >
                      {uploadingMedia ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        '📷 Écraser / Remplacer la Photo'
                      )}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleOverwritePhoto}
                        className="hidden"
                        disabled={uploadingMedia}
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Bloc Badge PDF */}
                <div className="flex flex-col space-y-3 p-4 bg-base-200/50 rounded-lg border border-base-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm">Badge Individuel (PDF)</h3>
                      <p className="text-xs text-base-content/60">
                        Fichier stocké dans{' '}
                        <code className="text-xs font-mono">/uploads/badges/{formData.matEtudiant}.pdf</code>.
                      </p>
                    </div>
                    <a
                      href={`/uploads/badges/${formData.matEtudiant}.pdf?t=${mediaTimestamp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-xs btn-secondary btn-outline"
                    >
                      👁️ Aperçu PDF
                    </a>
                  </div>

                  <label className={`btn btn-sm btn-secondary w-full ${uploadingMedia ? 'btn-disabled' : ''}`}>
                    {uploadingMedia ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      '📑 Écraser / Remplacer le Badge PDF'
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleOverwritePdf}
                      className="hidden"
                      disabled={uploadingMedia}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de Modification Texte */}
          <form onSubmit={handleSave} className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body space-y-8">
              {/* Section 1 : Identifiants Principaux */}
              <div>
                <h2 className="text-lg font-bold border-b border-base-200 pb-2 text-primary flex items-center gap-2">
                  🪪 Identifiants Principaux
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Field field="matEtudiant" label="Matricule Étudiant" value={formData.matEtudiant} onChange={handleChange} disabled mono />
                  <Field field="nin" label="NIN" value={formData.nin} onChange={handleChange} mono />
                  <Field field="carteRfid" label="Carte RFID" value={formData.carteRfid} onChange={handleChange} mono />
                </div>
              </div>

              {/* Section 2 : Informations Personnelles */}
              <div>
                <h2 className="text-lg font-bold border-b border-base-200 pb-2 text-primary flex items-center gap-2">
                  👤 Informations Personnelles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Field field="nom" label="Nom (FR)" value={formData.nom} onChange={handleChange} required />
                  <Field field="nomAr" label="اللقب (AR)" value={formData.nomAr} onChange={handleChange} dir="rtl" />

                  <Field field="prenom" label="Prénom (FR)" value={formData.prenom} onChange={handleChange} required />
                  <Field field="prenomAr" label="الاسم (AR)" value={formData.prenomAr} onChange={handleChange} dir="rtl" />

                  <SelectField field="civilite" label="Civilité" value={formData.civilite} onChange={handleChange} options={CIVILITE_OPTIONS} />
                  <SelectField field="sexe" label="Sexe" value={formData.sexe} onChange={handleChange} options={SEXE_OPTIONS} />

                  <Field field="dateNaissance" label="Date de Naissance" value={formData.dateNaissance} onChange={handleChange} placeholder="JJ/MM/AAAA" />
                  <SelectField field="groupeSanguin" label="Groupe Sanguin" value={formData.groupeSanguin} onChange={handleChange} options={GROUPE_SANGUIN_OPTIONS} placeholder="-- Choisir --" />

                  <Field field="lieuNaissance" label="Lieu de Naissance (FR)" value={formData.lieuNaissance} onChange={handleChange} />
                  <Field field="lieuNaissanceAr" label="مكان الميلاد (AR)" value={formData.lieuNaissanceAr} onChange={handleChange} dir="rtl" />

                  <Field field="nationalite" label="Nationalité (FR)" value={formData.nationalite} onChange={handleChange} />
                  <Field field="nationaliteAr" label="الجنسية (AR)" value={formData.nationaliteAr} onChange={handleChange} dir="rtl" />

                  <Field field="telephone" label="Téléphone" value={formData.telephone} onChange={handleChange} />
                  <Field field="situationFamiliale" label="Situation Familiale" value={formData.situationFamiliale} onChange={handleChange} />

                  <Field
                    field="adresse"
                    label="Adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    wrapperClassName="md:col-span-2"
                  />
                </div>
              </div>

              {/* Section 3 : Informations Parentales */}
              <div>
                <h2 className="text-lg font-bold border-b border-base-200 pb-2 text-primary flex items-center gap-2">
                  👨‍👩‍👦 Informations Parentales
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Field field="prenomPere" label="Prénom du Père (FR)" value={formData.prenomPere} onChange={handleChange} />
                  <Field field="prenomPereAr" label="اسم الأب (AR)" value={formData.prenomPereAr} onChange={handleChange} dir="rtl" />

                  <Field field="nomMere" label="Nom de la Mère (FR)" value={formData.nomMere} onChange={handleChange} />
                  <Field field="nomMereAr" label="لقب الأم (AR)" value={formData.nomMereAr} onChange={handleChange} dir="rtl" />

                  <Field field="prenomMere" label="Prénom de la Mère (FR)" value={formData.prenomMere} onChange={handleChange} />
                  <Field field="prenomMereAr" label="اسم الأم (AR)" value={formData.prenomMereAr} onChange={handleChange} dir="rtl" />
                </div>
              </div>

              {/* Section 4 : Origine Géographique & Baccalauréat */}
              <div>
                <h2 className="text-lg font-bold border-b border-base-200 pb-2 text-primary flex items-center gap-2">
                  📜 Baccalauréat & Origine Géographique
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Field field="matBac" label="Matricule BAC" value={formData.matBac} onChange={handleChange} mono />
                  <Field field="anneeBac" label="Année BAC" value={formData.anneeBac} onChange={handleChange} type="number" parse={parseIntOrUndefined} />
                  <Field
                    field="moyenneBac"
                    label="Moyenne BAC"
                    value={formData.moyenneBac}
                    onChange={handleChange}
                    type="number"
                    parse={parseFloatOrUndefined}
                    step="0.01"
                    min="0"
                    max="20"
                    inputClassName="font-bold text-primary"
                  />

                  <Field field="serieBac" label="Série BAC" value={formData.serieBac} onChange={handleChange} />
                  <Field
                    field="libelleBac"
                    label="Libellé BAC"
                    value={formData.libelleBac}
                    onChange={handleChange}
                    wrapperClassName="md:col-span-2"
                  />

                  <Field field="wilayaNaissance" label="Wilaya Naissance" value={formData.wilayaNaissance} onChange={handleChange} />
                  <Field field="wilayaBac" label="Wilaya BAC" value={formData.wilayaBac} onChange={handleChange} />
                  <Field field="wilayaResidence" label="Wilaya Résidence" value={formData.wilayaResidence} onChange={handleChange} />
                </div>
              </div>

              {/* Section 5 : Parcours Académique */}
              <div>
                <h2 className="text-lg font-bold border-b border-base-200 pb-2 text-primary flex items-center gap-2">
                  🎓 Parcours Académique
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Field field="niveau" label="Niveau (FR)" value={formData.niveau} onChange={handleChange} />
                  <Field field="niveauAr" label="المستوى (AR)" value={formData.niveauAr} onChange={handleChange} dir="rtl" />

                  <Field field="filiere" label="Filière / الرتبة (FR)" value={formData.filiere} onChange={handleChange} />
                  <Field field="filiereAr" label="الشعبة / الرتبة (AR)" value={formData.filiereAr} onChange={handleChange} dir="rtl" />

                  <Field field="specialite" label="Spécialité (FR)" value={formData.specialite} onChange={handleChange} />
                  <Field field="specialiteAr" label="التخصص (AR)" value={formData.specialiteAr} onChange={handleChange} dir="rtl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <CodeLibelleField
                    label="Domaine (Code / Libellé)"
                    codeField="codeDomaine"
                    libelleField="libelleDomaine"
                    codeValue={formData.codeDomaine}
                    libelleValue={formData.libelleDomaine}
                    onChange={handleChange}
                    libellePlaceholder="Libellé Domaine"
                  />
                  <CodeLibelleField
                    label="Filière (Code / Libellé)"
                    codeField="codeFiliere"
                    libelleField="libelleFiliere"
                    codeValue={formData.codeFiliere}
                    libelleValue={formData.libelleFiliere}
                    onChange={handleChange}
                    libellePlaceholder="Libellé Filière"
                  />
                  <CodeLibelleField
                    label="Cycle (Code / Libellé)"
                    codeField="codeCycle"
                    libelleField="libelleCycle"
                    codeValue={formData.codeCycle}
                    libelleValue={formData.libelleCycle}
                    onChange={handleChange}
                    libellePlaceholder="Libellé Cycle"
                  />

                  <Field field="structure" label="Structure" value={formData.structure} onChange={handleChange} />
                  <Field field="codeNiveau" label="Code Niveau" value={formData.codeNiveau} onChange={handleChange} mono />
                  <Field
                    field="dateValidationInscription"
                    label="Date Validation Inscription"
                    value={formData.dateValidationInscription}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Section 6 : Statut & Situation Administrative */}
              <div>
                <h2 className="text-lg font-bold border-b border-base-200 pb-2 text-primary flex items-center gap-2">
                  💳 Situation Administrative & Statuts
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Field field="sitIns" label="Situation Inscription (sitIns)" value={formData.sitIns} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <CheckboxField
                    field="fraisInscriptionPaye"
                    label="Frais Inscription"
                    value={formData.fraisInscriptionPaye}
                    onChange={handleChange}
                    colorClass="checkbox-primary"
                  />
                  <CheckboxField
                    field="fraisTransportPaye"
                    label="Frais Transport"
                    value={formData.fraisTransportPaye}
                    onChange={handleChange}
                    colorClass="checkbox-primary"
                  />
                  <CheckboxField
                    field="redoublant"
                    label="Redoublant"
                    value={formData.redoublant}
                    onChange={handleChange}
                    colorClass="checkbox-warning"
                  />
                  <CheckboxField
                    field="transfert"
                    label="Transfert"
                    value={formData.transfert}
                    onChange={handleChange}
                    colorClass="checkbox-info"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="card-actions justify-end gap-2 pt-4 border-t border-base-200">
                <button type="button" onClick={() => closeModalOrGoBack('close')} className="btn btn-ghost">
                  Annuler
                </button>
                <button type="submit" disabled={saving || uploadingMedia} className="btn btn-primary min-w-36">
                  {saving ? <span className="loading loading-spinner"></span> : '💾 Enregistrer & Enlever'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ModifierEtudiantPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <ModifierEtudiantContent />
    </Suspense>
  );
}