'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Availability = {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  motif?: string | null;
};

type Teacher = {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  specialite?: string | null;
  grade?: string | null;
  statut?: string | null;
  maxCoursParJour?: number | null;
  maxHeuresParSemaine?: number | null;
  disponibilites?: Availability[];
};

type Room = {
  id: string;
  nom: string;
  type?: string | null;
  capacite?: number | null;
  batiment?: string | null;
  numero?: string | null;
  disponibilites?: Availability[];
};

type Seance = {
  id: string;
  module: string;
  type: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  groupe: string;
  filiere?: string | null;
  semestre?: number | null;
  enseignantId?: string | null;
  salleId?: string | null;
  enseignant?: Teacher | null;
  salle?: Room | null;
};

type PlanningItem = {
  seanceId: string;
  day: string;
  start: string;
  end: string;
  roomId: string | null;
  teacherId: string | null;
};

type PlanningConflict = {
  seanceId: string;
  module: string;
  reason: string;
};

const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const COURSE_TYPES = ['CM', 'TD', 'TP'];

const initialTeacherForm = {
  nom: '',
  prenom: '',
  email: '',
  specialite: '',
  grade: '',
  statut: 'Permanent',
  maxCoursParJour: '3',
  maxHeuresParSemaine: '18',
};

const initialRoomForm = {
  nom: '',
  type: 'Amphi',
  capacite: '30',
  batiment: '',
  numero: '',
};

const initialSeanceForm = {
  module: '',
  type: 'CM',
  jour: 'LUNDI',
  heureDebut: '08:00',
  heureFin: '09:30',
  groupe: '',
  filiere: '',
  semestre: '',
  enseignantId: '',
  salleId: '',
};

const initialTeacherAvailability = {
  enseignantId: '',
  jour: 'LUNDI',
  heureDebut: '08:00',
  heureFin: '09:30',
  motif: '',
};

const initialRoomAvailability = {
  salleId: '',
  jour: 'LUNDI',
  heureDebut: '08:00',
  heureFin: '09:30',
  motif: '',
};

export default function TimetableAdminPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [planning, setPlanning] = useState<{ planned: PlanningItem[]; conflicts: PlanningConflict[]; days: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [roomForm, setRoomForm] = useState(initialRoomForm);
  const [seanceForm, setSeanceForm] = useState(initialSeanceForm);
  const [teacherAvailabilityForm, setTeacherAvailabilityForm] = useState(initialTeacherAvailability);
  const [roomAvailabilityForm, setRoomAvailabilityForm] = useState(initialRoomAvailability);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersRes, roomsRes, seancesRes, planningRes] = await Promise.all([
        fetch('/api/enseignants'),
        fetch('/api/salles'),
        fetch('/api/seances'),
        fetch('/api/planning'),
      ]);

      const teachersData = await teachersRes.json();
      const roomsData = await roomsRes.json();
      const seancesData = await seancesRes.json();
      const planningData = await planningRes.json();

      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setSeances(Array.isArray(seancesData) ? seancesData : []);
      setPlanning(
        planningData && Array.isArray(planningData.planned)
          ? { planned: planningData.planned, conflicts: planningData.conflicts ?? [], days: planningData.days ?? DAYS }
          : null,
      );
    } catch (error) {
      console.error('Erreur chargement données planning:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teacherOptions = useMemo(() => teachers.map((t) => ({ id: t.id, label: `${t.nom} ${t.prenom}` })), [teachers]);
  const roomOptions = useMemo(() => rooms.map((r) => ({ id: r.id, label: `${r.nom} (${r.type ?? 'Salle'})` })), [rooms]);

  const submitTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/enseignants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...teacherForm,
          maxCoursParJour: Number(teacherForm.maxCoursParJour),
          maxHeuresParSemaine: Number(teacherForm.maxHeuresParSemaine),
        }),
      });
      if (!res.ok) throw new Error('Impossible de créer l’enseignant');
      setTeacherForm(initialTeacherForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création de l’enseignant');
    }
  };

  const submitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/salles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomForm,
          capacite: Number(roomForm.capacite),
        }),
      });
      if (!res.ok) throw new Error('Impossible de créer la salle');
      setRoomForm(initialRoomForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création de la salle');
    }
  };

  const submitTeacherAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/enseignants/disponibilites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...teacherAvailabilityForm,
        }),
      });
      if (!res.ok) throw new Error('Impossible d’ajouter la disponibilité');
      setTeacherAvailabilityForm(initialTeacherAvailability);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l’ajout de la disponibilité enseignant');
    }
  };

  const submitRoomAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/salles/disponibilites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomAvailabilityForm,
        }),
      });
      if (!res.ok) throw new Error('Impossible d’ajouter la disponibilité');
      setRoomAvailabilityForm(initialRoomAvailability);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l’ajout de la disponibilité salle');
    }
  };

  const submitSeance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/seances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...seanceForm,
          semestre: seanceForm.semestre ? Number(seanceForm.semestre) : null,
        }),
      });
      if (!res.ok) throw new Error('Impossible de créer la séance');
      setSeanceForm(initialSeanceForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création de la séance');
    }
  };

  const generatePlanning = async () => {
    try {
      const res = await fetch('/api/planning');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Erreur génération');
      setPlanning({ planned: data.planned ?? [], conflicts: data.conflicts ?? [], days: data.days ?? DAYS });
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du planning');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">Gestion</div>
            <h1 className="text-2xl font-bold">Planning académique</h1>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary btn-sm" onClick={generatePlanning}>
              Générer le planning
            </button>
            <Link href="/" className="btn btn-ghost btn-sm">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body py-10 text-center text-base-content/60">Chargement des données…</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <form className="card bg-base-100 shadow-md border border-base-200" onSubmit={submitTeacher}>
              <div className="card-body gap-4">
                <h2 className="font-bold text-lg">Ajouter un enseignant</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input input-bordered w-full" placeholder="Nom" value={teacherForm.nom} onChange={(e) => setTeacherForm({ ...teacherForm, nom: e.target.value })} />
                  <input className="input input-bordered w-full" placeholder="Prénom" value={teacherForm.prenom} onChange={(e) => setTeacherForm({ ...teacherForm, prenom: e.target.value })} />
                  <input className="input input-bordered w-full" placeholder="Email" type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
                  <input className="input input-bordered w-full" placeholder="Spécialité" value={teacherForm.specialite} onChange={(e) => setTeacherForm({ ...teacherForm, specialite: e.target.value })} />
                  <input className="input input-bordered w-full" placeholder="Grade" value={teacherForm.grade} onChange={(e) => setTeacherForm({ ...teacherForm, grade: e.target.value })} />
                  <select className="select select-bordered w-full" value={teacherForm.statut} onChange={(e) => setTeacherForm({ ...teacherForm, statut: e.target.value })}>
                    <option value="Permanent">Permanent</option>
                    <option value="Vacataire">Vacataire</option>
                    <option value="Intérim">Intérim</option>
                  </select>
                  <input className="input input-bordered w-full" type="number" min={1} max={10} placeholder="Max cours / jour" value={teacherForm.maxCoursParJour} onChange={(e) => setTeacherForm({ ...teacherForm, maxCoursParJour: e.target.value })} />
                  <input className="input input-bordered w-full" type="number" min={1} max={40} placeholder="Max heures / semaine" value={teacherForm.maxHeuresParSemaine} onChange={(e) => setTeacherForm({ ...teacherForm, maxHeuresParSemaine: e.target.value })} />
                </div>
                <button className="btn btn-primary" type="submit">Enregistrer</button>
              </div>
            </form>

            <form className="card bg-base-100 shadow-md border border-base-200" onSubmit={submitRoom}>
              <div className="card-body gap-4">
                <h2 className="font-bold text-lg">Ajouter une salle</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input input-bordered w-full" placeholder="Nom de la salle" value={roomForm.nom} onChange={(e) => setRoomForm({ ...roomForm, nom: e.target.value })} />
                  <select className="select select-bordered w-full" value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}>
                    <option value="Amphi">Amphi</option>
                    <option value="TD">TD</option>
                    <option value="TP">TP</option>
                    <option value="Laboratoire">Laboratoire</option>
                  </select>
                  <input className="input input-bordered w-full" type="number" min={10} placeholder="Capacité" value={roomForm.capacite} onChange={(e) => setRoomForm({ ...roomForm, capacite: e.target.value })} />
                  <input className="input input-bordered w-full" placeholder="Bâtiment" value={roomForm.batiment} onChange={(e) => setRoomForm({ ...roomForm, batiment: e.target.value })} />
                  <input className="input input-bordered w-full md:col-span-2" placeholder="Numéro / étage" value={roomForm.numero} onChange={(e) => setRoomForm({ ...roomForm, numero: e.target.value })} />
                </div>
                <button className="btn btn-primary" type="submit">Enregistrer</button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <form className="card bg-base-100 shadow-md border border-base-200" onSubmit={submitTeacherAvailability}>
              <div className="card-body gap-4">
                <h2 className="font-bold text-lg">Disponibilité enseignant</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className="select select-bordered w-full" value={teacherAvailabilityForm.enseignantId} onChange={(e) => setTeacherAvailabilityForm({ ...teacherAvailabilityForm, enseignantId: e.target.value })}>
                    <option value="">Choisir un enseignant</option>
                    {teacherOptions.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.label}</option>
                    ))}
                  </select>
                  <select className="select select-bordered w-full" value={teacherAvailabilityForm.jour} onChange={(e) => setTeacherAvailabilityForm({ ...teacherAvailabilityForm, jour: e.target.value })}>
                    {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                  <input className="input input-bordered w-full" type="time" value={teacherAvailabilityForm.heureDebut} onChange={(e) => setTeacherAvailabilityForm({ ...teacherAvailabilityForm, heureDebut: e.target.value })} />
                  <input className="input input-bordered w-full" type="time" value={teacherAvailabilityForm.heureFin} onChange={(e) => setTeacherAvailabilityForm({ ...teacherAvailabilityForm, heureFin: e.target.value })} />
                  <input className="input input-bordered w-full md:col-span-2" placeholder="Motif (ex: Congé, réunion, indisponibilité...)" value={teacherAvailabilityForm.motif} onChange={(e) => setTeacherAvailabilityForm({ ...teacherAvailabilityForm, motif: e.target.value })} />
                </div>
                <button className="btn btn-secondary" type="submit">Enregistrer</button>
              </div>
            </form>

            <form className="card bg-base-100 shadow-md border border-base-200" onSubmit={submitRoomAvailability}>
              <div className="card-body gap-4">
                <h2 className="font-bold text-lg">Disponibilité salle</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className="select select-bordered w-full" value={roomAvailabilityForm.salleId} onChange={(e) => setRoomAvailabilityForm({ ...roomAvailabilityForm, salleId: e.target.value })}>
                    <option value="">Choisir une salle</option>
                    {roomOptions.map((room) => (
                      <option key={room.id} value={room.id}>{room.label}</option>
                    ))}
                  </select>
                  <select className="select select-bordered w-full" value={roomAvailabilityForm.jour} onChange={(e) => setRoomAvailabilityForm({ ...roomAvailabilityForm, jour: e.target.value })}>
                    {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                  <input className="input input-bordered w-full" type="time" value={roomAvailabilityForm.heureDebut} onChange={(e) => setRoomAvailabilityForm({ ...roomAvailabilityForm, heureDebut: e.target.value })} />
                  <input className="input input-bordered w-full" type="time" value={roomAvailabilityForm.heureFin} onChange={(e) => setRoomAvailabilityForm({ ...roomAvailabilityForm, heureFin: e.target.value })} />
                  <input className="input input-bordered w-full md:col-span-2" placeholder="Motif (maintenance, réservation, etc.)" value={roomAvailabilityForm.motif} onChange={(e) => setRoomAvailabilityForm({ ...roomAvailabilityForm, motif: e.target.value })} />
                </div>
                <button className="btn btn-secondary" type="submit">Enregistrer</button>
              </div>
            </form>
          </div>

          <form className="card bg-base-100 shadow-md border border-base-200" onSubmit={submitSeance}>
            <div className="card-body gap-4">
              <h2 className="font-bold text-lg">Ajouter une séance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="input input-bordered w-full" placeholder="Module" value={seanceForm.module} onChange={(e) => setSeanceForm({ ...seanceForm, module: e.target.value })} />
                <select className="select select-bordered w-full" value={seanceForm.type} onChange={(e) => setSeanceForm({ ...seanceForm, type: e.target.value })}>
                  {COURSE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select className="select select-bordered w-full" value={seanceForm.jour} onChange={(e) => setSeanceForm({ ...seanceForm, jour: e.target.value })}>
                  {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
                <input className="input input-bordered w-full" type="time" value={seanceForm.heureDebut} onChange={(e) => setSeanceForm({ ...seanceForm, heureDebut: e.target.value })} />
                <input className="input input-bordered w-full" type="time" value={seanceForm.heureFin} onChange={(e) => setSeanceForm({ ...seanceForm, heureFin: e.target.value })} />
                <input className="input input-bordered w-full" placeholder="Groupe / promo" value={seanceForm.groupe} onChange={(e) => setSeanceForm({ ...seanceForm, groupe: e.target.value })} />
                <input className="input input-bordered w-full" placeholder="Filière" value={seanceForm.filiere} onChange={(e) => setSeanceForm({ ...seanceForm, filiere: e.target.value })} />
                <input className="input input-bordered w-full" type="number" placeholder="Semestre" value={seanceForm.semestre} onChange={(e) => setSeanceForm({ ...seanceForm, semestre: e.target.value })} />
                <select className="select select-bordered w-full" value={seanceForm.enseignantId} onChange={(e) => setSeanceForm({ ...seanceForm, enseignantId: e.target.value })}>
                  <option value="">Enseignant</option>
                  {teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.label}</option>)}
                </select>
                <select className="select select-bordered w-full" value={seanceForm.salleId} onChange={(e) => setSeanceForm({ ...seanceForm, salleId: e.target.value })}>
                  <option value="">Salle</option>
                  {roomOptions.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}
                </select>
              </div>
              <div className="mt-4">
                <button className="btn btn-primary" type="submit">Enregistrer la séance</button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body">
                <h2 className="font-bold text-lg">Enseignants</h2>
                <div className="space-y-2">
                  {teachers.length === 0 ? <p className="text-sm text-base-content/60">Aucun enseignant enregistré.</p> : teachers.map((teacher) => (
                    <div key={teacher.id} className="border rounded-xl p-3 bg-base-200/30">
                      <div className="font-semibold">{teacher.prenom} {teacher.nom}</div>
                      <div className="text-xs text-base-content/60">{teacher.specialite || 'Spécialité non renseignée'} · {teacher.statut || 'Permanent'}</div>
                      {teacher.disponibilites && teacher.disponibilites.length > 0 && (
                        <div className="mt-2 text-xs">
                          {teacher.disponibilites.map((item) => (
                            <span key={item.id} className="badge badge-ghost mr-1 mb-1">{item.jour} {item.heureDebut}-{item.heureFin}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body">
                <h2 className="font-bold text-lg">Salles</h2>
                <div className="space-y-2">
                  {rooms.length === 0 ? <p className="text-sm text-base-content/60">Aucune salle enregistrée.</p> : rooms.map((room) => (
                    <div key={room.id} className="border rounded-xl p-3 bg-base-200/30">
                      <div className="font-semibold">{room.nom}</div>
                      <div className="text-xs text-base-content/60">{room.type} · {room.capacite ?? 0} places</div>
                      {room.disponibilites && room.disponibilites.length > 0 && (
                        <div className="mt-2 text-xs">
                          {room.disponibilites.map((item) => (
                            <span key={item.id} className="badge badge-info mr-1 mb-1">{item.jour} {item.heureDebut}-{item.heureFin}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="font-bold text-lg">Séances</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Type</th>
                      <th>Jour</th>
                      <th>Horaire</th>
                      <th>Groupe</th>
                      <th>Enseignant</th>
                      <th>Salle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seances.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-base-content/60">Aucune séance enregistrée.</td></tr>
                    ) : seances.map((seance) => (
                      <tr key={seance.id}>
                        <td>{seance.module}</td>
                        <td>{seance.type}</td>
                        <td>{seance.jour}</td>
                        <td>{seance.heureDebut} - {seance.heureFin}</td>
                        <td>{seance.groupe}</td>
                        <td>{seance.enseignant ? `${seance.enseignant.prenom} ${seance.enseignant.nom}` : '—'}</td>
                        <td>{seance.salle ? seance.salle.nom : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="font-bold text-lg">Planning généré</h2>
              {planning ? (
                <>
                  <div className="mb-4 text-sm text-base-content/70">
                    {planning.conflicts.length === 0 ? 'Aucun conflit détecté.' : `${planning.conflicts.length} conflit(s) détecté(s).`}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>Jour</th>
                          <th>Horaire</th>
                          <th>Salle</th>
                          <th>Enseignant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planning.planned.length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-base-content/60">Aucune séance planifiée.</td></tr>
                        ) : planning.planned.map((item) => {
                          const teacher = teachers.find((t) => t.id === item.teacherId);
                          const room = rooms.find((r) => r.id === item.roomId);
                          return (
                            <tr key={`${item.seanceId}-${item.day}-${item.start}`}>
                              <td>{item.day}</td>
                              <td>{item.start} - {item.end}</td>
                              <td>{room?.nom ?? '—'}</td>
                              <td>{teacher ? `${teacher.prenom} ${teacher.nom}` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {planning.conflicts.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Conflits</h3>
                      <ul className="space-y-2">
                        {planning.conflicts.map((conflict, index) => (
                          <li key={`${conflict.seanceId}-${index}`} className="text-sm text-error">{conflict.module}: {conflict.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-base-content/60">Cliquez sur “Générer le planning” pour calculer le calendrier.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

