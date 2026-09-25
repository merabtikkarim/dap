'use client';

import './globals.css';
import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface FiliereItem {
  filiere: string;
  filiereAr?: string;
}

const THEMES = [
  'light', 'dark', 'emerald', 'corporate', 'synthwave',
  'cyberpunk', 'valentine', 'halloween', 'garden', 'forest',
  'aqua', 'lofi', 'pastel', 'fantasy', 'luxury', 'dracula',
  'cmyk', 'autumn', 'business', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'
];

const NAV_ITEMS = [
  { href: '/', label: 'Tableau de bord', icon: '📊' },
  { href: '/etudiants', label: 'Étudiants', icon: '👥' },
  { href: '/impression-fiches', label: 'Impression Fiches PDF', icon: '📄' },
  { href: '/modifier', label: 'Modification cas par cas', icon: '✏️' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('emerald');
  const [filieres, setFilieres] = useState<FiliereItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Charger le thème
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'emerald';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Charger les filières dynamiquement
  const fetchFilieres = async () => {
    try {
      const res = await fetch('/api/filieres');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFilieres(data);
      }
    } catch (error) {
      console.error('Erreur chargement filières:', error);
    }
  };

  useEffect(() => {
    fetchFilieres();
  }, [pathname]); // Recharge si la page change

  // Ferme les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/etudiants?q=${encodeURIComponent(q)}` : '/etudiants');
  };

  const currentPageLabel =
    NAV_ITEMS.find((item) => item.href === pathname)?.label || 'Tableau de bord';

  return (
    <html lang="fr" data-theme={theme}>
      <body className="min-h-screen bg-base-200">
        <div className="drawer lg:drawer-open">
          <input id="my-drawer" type="checkbox" className="drawer-toggle" />

          {/* Contenu Principal */}
          <div className="drawer-content flex flex-col min-h-screen">
            {/* Header */}
            <div className="w-full navbar bg-base-100 border-b border-base-300 px-4 gap-3 sticky top-0 z-30">
              <div className="flex-none lg:hidden">
                <label htmlFor="my-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </label>
              </div>

              {/* Titre de la page courante (masqué sur mobile pour laisser place à la recherche) */}
              <div className="hidden md:block font-semibold text-base-content/80 shrink-0">
                {currentPageLabel}
              </div>

              {/* Barre de recherche centrale */}
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-auto">
                <label className="input input-bordered input-sm flex items-center gap-2 w-full bg-base-200/60">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 opacity-50 stroke-current" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.34-4.34M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                  </svg>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Rechercher un étudiant (nom, matricule...)"
                    className="grow"
                  />
                </label>
              </form>

              <div className="flex items-center gap-1 shrink-0">
                {/* Notifications */}
                <div className="dropdown dropdown-end" ref={notifRef}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-circle btn-sm"
                    onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
                    aria-label="Notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 stroke-current" fill="none">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  {notifOpen && (
                    <div className="dropdown-content z-[50] mt-3 w-72 card bg-base-100 shadow border border-base-300">
                      <div className="card-body p-4">
                        <h4 className="font-bold text-sm">Notifications</h4>
                        <p className="text-xs text-base-content/60 pt-1">
                          Aucune notification pour le moment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profil + Thème */}
                <div className="dropdown dropdown-end" ref={profileRef}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm gap-2 normal-case px-2"
                    onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
                  >
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8">
                        <span className="text-xs font-bold">AD</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold">Administration</span>
                      <span className="text-[11px] text-base-content/60">Gestion Académique</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 stroke-current opacity-60" fill="none">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="dropdown-content z-[50] mt-3 w-64 card bg-base-100 shadow border border-base-300">
                      <div className="card-body p-3 gap-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-base-content/50 px-1">
                          🎨 Thème
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <ul className="menu menu-sm p-0 gap-0.5">
                            {THEMES.map((t) => (
                              <li key={t}>
                                <button
                                  className={`capitalize ${theme === t ? 'active font-bold' : ''}`}
                                  onClick={() => changeTheme(t)}
                                >
                                  {t}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Zone de contenu */}
            <div className="p-4 md:p-6 flex-1">{children}</div>
          </div>

          {/* Sidebar Latérale */}
          <div className="drawer-side z-40">
            <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
            <aside className="bg-base-100 text-base-content min-h-full w-72 p-4 border-r border-base-300 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header Logo */}
                <div className="flex items-center gap-3 px-2 py-4 border-b border-base-200">
                  <div className="w-11 h-11 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold text-xl shadow">
                    🎓
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-tight">ENS Saïda</h2>
                    <span className="text-xs text-base-content/60">DAP - Gestion Académique</span>
                  </div>
                </div>

                {/* Menu Général */}
                <ul className="menu menu-md rounded-box gap-1 p-0">
                  <li className="menu-title text-xs font-bold uppercase tracking-wider text-base-content/50">Navigation</li>
                  {NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={pathname === item.href ? 'active font-semibold' : ''}
                      >
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Section Filières Dynamiques */}
                <div className="pt-2">
                  <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-base-content/50 flex justify-between items-center">
                    <span>Filières ({filieres.length})</span>
                  </div>

                  <ul className="menu menu-sm rounded-box gap-1 p-0 max-h-80 overflow-y-auto">
                    {filieres.length === 0 ? (
                      <li className="text-xs text-base-content/50 px-3 py-2">Aucune filière trouvée</li>
                    ) : (
                      filieres.map((f) => (
                        <li key={f.filiere}>
                          <Link
                            href={`/etudiants?filiere=${encodeURIComponent(f.filiere)}`}
                            className="flex justify-between items-center"
                          >
                            <span className="truncate">{f.filiere}</span>
                            {f.filiereAr && (
                              <span className="text-[10px] opacity-60 truncate ml-1" dir="rtl">
                                {f.filiereAr}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Footnote */}
              <div className="p-2 border-t border-base-200 text-xs text-center text-base-content/60">
                ENS Saïda &copy; {new Date().getFullYear()}
              </div>
            </aside>
          </div>
        </div>
      </body>
    </html>
  );
}
