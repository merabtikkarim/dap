// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Etudiant {
  matEtudiant: string;
  nom: string;
  prenom: string;
  sexe?: string;
  niveau?: string;
  filiere?: string;
  specialite?: string;
  fraisInscriptionPaye: boolean;
  fraisTransportPaye?: boolean;
  redoublant?: boolean;
  transfert?: boolean;
}

interface QuickAction {
  href: string;
  icon: string;
  title: string;
  description: string;
  accent: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/etudiants',
    icon: '👥',
    title: 'Liste des étudiants',
    description: "Rechercher, filtrer, importer un fichier PROGRES (CSV) et consulter les fiches.",
    accent: 'bg-primary/10 text-primary',
  },
  {
    href: '/impression-fiches',
    icon: '📄',
    title: 'Impression Fiches PDF',
    description: "Générer et imprimer les fiches d'inscription des étudiants.",
    accent: 'bg-secondary/10 text-secondary',
  },
  {
    href: '/modifier',
    icon: '✏️',
    title: 'Modification cas par cas',
    description: "Corriger ou compléter le dossier d'un étudiant spécifique.",
    accent: 'bg-accent/10 text-accent',
  },
  {
    href: '/import-badges',
    icon: '🎴',
    title: 'Importer Badges (PDF)',
    description: 'Associer les badges PDF générés aux dossiers étudiants.',
    accent: 'bg-info/10 text-info',
  },
];

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function DistributionList({
  title,
  data,
  total,
  emptyLabel,
}: {
  title: string;
  data: [string, number][];
  total: number;
  emptyLabel: string;
}) {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200 h-full">
      <div className="card-body">
        <h3 className="card-title text-base">{title}</h3>
        {data.length === 0 ? (
          <p className="text-sm text-base-content/60 py-4">{emptyLabel}</p>
        ) : (
          <div className="space-y-3 pt-2">
            {data.map(([label, count]) => (
              <div key={label}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium truncate pr-2">{label}</span>
                  <span className="text-base-content/60 shrink-0">
                    {count} · {pct(count, total)}%
                  </span>
                </div>
                <progress
                  className="progress progress-primary w-full"
                  value={count}
                  max={total || 1}
                ></progress>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEtudiants = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/etudiants');
        const data = await res.json();
        if (Array.isArray(data)) setEtudiants(data);
      } catch (err) {
        console.error('Erreur chargement étudiants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEtudiants();
  }, []);

  const stats = useMemo(() => {
    const total = etudiants.length;
    const inscriptionPayee = etudiants.filter((e) => e.fraisInscriptionPaye).length;
    const transportPaye = etudiants.filter((e) => e.fraisTransportPaye).length;
    const redoublants = etudiants.filter((e) => e.redoublant).length;
    const transferts = etudiants.filter((e) => e.transfert).length;
    const hommes = etudiants.filter((e) => e.sexe === 'MASCULIN').length;
    const femmes = etudiants.filter((e) => e.sexe === 'FEMININ').length;

    const countBy = (getKey: (e: Etudiant) => string | undefined) => {
      const map = new Map<string, number>();
      etudiants.forEach((e) => {
        const key = getKey(e);
        if (!key) return;
        map.set(key, (map.get(key) || 0) + 1);
      });
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    };

    const parFiliere = countBy((e) => e.filiere);
    const parNiveau = countBy((e) => e.niveau);
    const parSpecialite = countBy((e) => e.specialite);

    return {
      total,
      inscriptionPayee,
      transportPaye,
      redoublants,
      transferts,
      hommes,
      femmes,
      parFiliere,
      parNiveau,
      parSpecialite,
      nbFilieres: parFiliere.length,
    };
  }, [etudiants]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="card-title text-2xl font-bold flex items-center gap-2">
              <span>📊</span> Tableau de bord
            </h1>
            <p className="text-sm text-base-content/70">
              Vue d&apos;ensemble de la gestion académique — ENS Saïda.
            </p>
          </div>
          <Link href="/etudiants" className="btn btn-primary btn-sm">
            👥 Voir la liste des étudiants
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : stats.total === 0 ? (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body items-center text-center py-16">
            <span className="text-4xl mb-2">📭</span>
            <h3 className="font-bold text-lg">Aucune donnée pour le moment</h3>
            <p className="text-sm text-base-content/60 max-w-md">
              Importez un fichier PROGRES (CSV) depuis la page « Liste des étudiants » pour
              commencer à voir les statistiques ici.
            </p>
            <Link href="/etudiants" className="btn btn-primary btn-sm mt-2">
              📥 Importer des étudiants
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Statistiques principales */}
          <div className="stats shadow-md w-full stats-vertical lg:stats-horizontal bg-base-100 border border-base-200">
            <div className="stat">
              <div className="stat-figure text-primary text-2xl">👥</div>
              <div className="stat-title">Total étudiants</div>
              <div className="stat-value text-primary">{stats.total}</div>
              <div className="stat-desc">
                {stats.hommes || stats.femmes
                  ? `${stats.hommes} H · ${stats.femmes} F`
                  : 'Tous niveaux confondus'}
              </div>
            </div>

            <div className="stat">
              <div className="stat-figure text-success text-2xl">💰</div>
              <div className="stat-title">Frais d&apos;inscription payés</div>
              <div className="stat-value text-success">
                {pct(stats.inscriptionPayee, stats.total)}%
              </div>
              <div className="stat-desc">
                {stats.inscriptionPayee} / {stats.total} étudiants
              </div>
            </div>

            <div className="stat">
              <div className="stat-figure text-warning text-2xl">🔁</div>
              <div className="stat-title">Redoublants</div>
              <div className="stat-value text-warning">{stats.redoublants}</div>
              <div className="stat-desc">{pct(stats.redoublants, stats.total)}% des étudiants</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-info text-2xl">🏫</div>
              <div className="stat-title">Filières actives</div>
              <div className="stat-value text-info">{stats.nbFilieres}</div>
              <div className="stat-desc">{stats.transferts} transfert(s)</div>
            </div>
          </div>

          {/* Paiements (radial progress) */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">État des paiements</h3>
              <div className="flex flex-wrap gap-8 justify-around items-center pt-2">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="radial-progress text-success"
                    style={
                      {
                        '--value': pct(stats.inscriptionPayee, stats.total),
                        '--size': '7rem',
                        '--thickness': '8px',
                      } as React.CSSProperties
                    }
                    role="progressbar"
                  >
                    {pct(stats.inscriptionPayee, stats.total)}%
                  </div>
                  <span className="text-sm font-medium">Inscription payée</span>
                  <span className="text-xs text-base-content/60">
                    {stats.inscriptionPayee} / {stats.total}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div
                    className="radial-progress text-accent"
                    style={
                      {
                        '--value': pct(stats.transportPaye, stats.total),
                        '--size': '7rem',
                        '--thickness': '8px',
                      } as React.CSSProperties
                    }
                    role="progressbar"
                  >
                    {pct(stats.transportPaye, stats.total)}%
                  </div>
                  <span className="text-sm font-medium">Transport payé</span>
                  <span className="text-xs text-base-content/60">
                    {stats.transportPaye} / {stats.total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Répartitions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DistributionList
              title="🏫 Répartition par filière"
              data={stats.parFiliere.slice(0, 8)}
              total={stats.total}
              emptyLabel="Aucune filière renseignée."
            />
            <DistributionList
              title="🎓 Répartition par niveau"
              data={stats.parNiveau}
              total={stats.total}
              emptyLabel="Aucun niveau renseigné."
            />
            <DistributionList
              title="🧪 Répartition par spécialité"
              data={stats.parSpecialite.slice(0, 8)}
              total={stats.total}
              emptyLabel="Aucune spécialité renseignée."
            />
          </div>
        </>
      )}

      {/* Accès rapides */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-base-content/50 mb-3 px-1">
          Accès rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg hover:border-primary/40 transition-all group"
            >
              <div className="card-body gap-2">
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl ${action.accent}`}
                >
                  {action.icon}
                </div>
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-base-content/60">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}