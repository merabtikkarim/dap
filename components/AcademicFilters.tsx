import React from 'react';

interface AcademicFiltersProps {
  selectedFiliere: string;
  setSelectedFiliere: (value: string) => void;
  selectedAnnee: string;
  setSelectedAnnee: (value: string) => void;
  selectedSpecialite: string;
  setSelectedSpecialite: (value: string) => void;
  /** Liste dynamique des spécialités extraites de vos données */
  specialiteList?: string[];
  /** Fonction optionnelle pour réinitialiser les filtres */
  onReset?: () => void;
}

export const AcademicFilters: React.FC<AcademicFiltersProps> = ({
  selectedFiliere,
  setSelectedFiliere,
  selectedAnnee,
  setSelectedAnnee,
  selectedSpecialite,
  setSelectedSpecialite,
  specialiteList = [],
  onReset,
}) => {
  return (
    <div className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Filtre Filière (Cycle / Grade) */}
        <div className="form-control w-full">
          <label className="label pb-1">
            <span className="label-text font-semibold text-sm">
              Filière / الرتبة
            </span>
          </label>
          <select
            className="select select-primary w-full"
            value={selectedFiliere}
            onChange={(e) => setSelectedFiliere(e.target.value)}
          >
            <option value="">Toutes les filières (الكل)</option>
            <option value="PES">PES - أستاذ التعليم الثانوي</option>
            <option value="PEM">PEM - أستاذ التعليم المتوسط</option>
            <option value="PEP">PEP - أستاذ المدرسة الابتدائية</option>
          </select>
        </div>

        {/* 2. Filtre Année (Niveau) */}
        <div className="form-control w-full">
          <label className="label pb-1">
            <span className="label-text font-semibold text-sm">
              Année / السنة
            </span>
          </label>
          <select
            className="select select-primary w-full"
            value={selectedAnnee}
            onChange={(e) => setSelectedAnnee(e.target.value)}
          >
            <option value="">Toutes les années (الكل)</option>
            <option value="1ère année">1ère année (السنة الأولى)</option>
            <option value="2ème année">2ème année (السنة الثانية)</option>
            <option value="3ème année">3ème année (السنة الثالثة)</option>
            <option value="4ème année">4ème année (السنة الرابعة)</option>
            <option value="5ème année">5ème année (السنة الخامسة)</option>
          </select>
        </div>

        {/* 3. Filtre Spécialité */}
        <div className="form-control w-full">
          <label className="label pb-1">
            <span className="label-text font-semibold text-sm">
              Spécialité / التخصص
            </span>
          </label>
          <select
            className="select select-primary w-full"
            value={selectedSpecialite}
            onChange={(e) => setSelectedSpecialite(e.target.value)}
          >
            <option value="">Toutes les spécialités (الكل)</option>
            {specialiteList.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bouton de réinitialisation si un filtre est actif */}
      {(selectedFiliere || selectedAnnee || selectedSpecialite) && (
        <div className="flex justify-end mt-3">
          <button
            onClick={() => {
              setSelectedFiliere('');
              setSelectedAnnee('');
              setSelectedSpecialite('');
              if (onReset) onReset();
            }}
            className="btn btn-ghost btn-xs text-error"
          >
            Réinitialiser les filtres ✕
          </button>
        </div>
      )}
    </div>
  );
};