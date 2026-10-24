'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type DayKey = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi';

type Session = {
  id: number;
  day: DayKey;
  time: string;
  module: string;
  promo: string;
  room: string;
  teacher: string;
  type: 'CM' | 'TD' | 'TP';
};

const DAYS: DayKey[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const TIME_SLOTS = ['08:00-09:30', '09:30-11:00', '11:00-12:30', '14:00-15:30', '15:30-17:00'];

const INITIAL_SESSIONS: Session[] = [
  { id: 1, day: 'Lundi', time: '08:00-09:30', module: 'Mathématiques', promo: 'L1 Info', room: 'A101', teacher: 'M. Benali', type: 'CM' },
  { id: 2, day: 'Lundi', time: '11:00-12:30', module: 'Algorithmique', promo: 'L2 Info', room: 'B204', teacher: 'Mme. Ait', type: 'TD' },
  { id: 3, day: 'Mardi', time: '09:30-11:00', module: 'Programmation', promo: 'L3 Info', room: 'Lab 1', teacher: 'M. Kaci', type: 'TP' },
  { id: 4, day: 'Mercredi', time: '14:00-15:30', module: 'Bases de données', promo: 'M1', room: 'C305', teacher: 'Mme. Djer', type: 'CM' },
  { id: 5, day: 'Jeudi', time: '15:30-17:00', module: 'Réseaux', promo: 'M2', room: 'A112', teacher: 'M. Hamdi', type: 'TD' },
  { id: 6, day: 'Vendredi', time: '11:00-12:30', module: 'Web avancé', promo: 'L3 Info', room: 'B112', teacher: 'M. Toumi', type: 'TP' },
  { id: 7, day: 'Vendredi', time: '14:00-15:30', module: 'Systèmes', promo: 'L2 Info', room: 'A203', teacher: 'Mme. Ziani', type: 'CM' },
];

const TYPE_STYLES: Record<Session['type'], string> = {
  CM: 'bg-primary/10 text-primary border-primary/20',
  TD: 'bg-secondary/10 text-secondary border-secondary/20',
  TP: 'bg-accent/10 text-accent border-accent/20',
};

export default function TimetablePage() {
  const [selectedPromo, setSelectedPromo] = useState('Toutes');
  const [selectedRoom, setSelectedRoom] = useState('Toutes');
  const [selectedDay, setSelectedDay] = useState<DayKey | 'Tous'>('Tous');

  const promos = useMemo(() => ['Toutes', ...new Set(INITIAL_SESSIONS.map((s) => s.promo))], []);
  const rooms = useMemo(() => ['Toutes', ...new Set(INITIAL_SESSIONS.map((s) => s.room))], []);

  const filteredSessions = useMemo(() => {
    return INITIAL_SESSIONS.filter((session) => {
      const promoOk = selectedPromo === 'Toutes' || session.promo === selectedPromo;
      const roomOk = selectedRoom === 'Toutes' || session.room === selectedRoom;
      const dayOk = selectedDay === 'Tous' || session.day === selectedDay;
      return promoOk && roomOk && dayOk;
    });
  }, [selectedPromo, selectedRoom, selectedDay]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Session[]>();

    for (const day of DAYS) {
      for (const time of TIME_SLOTS) {
        map.set(`${day}-${time}`, []);
      }
    }

    filteredSessions.forEach((session) => {
      const key = `${session.day}-${session.time}`;
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, session]);
    });

    return map;
  }, [filteredSessions]);

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">Planning</div>
            <h1 className="text-2xl font-bold">Emploi du temps</h1>
          </div>
          <Link href="/" className="btn btn-primary btn-sm">
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="form-control">
          <span className="label-text text-sm mb-2">Promotion</span>
          <select
            className="select select-bordered w-full"
            value={selectedPromo}
            onChange={(e) => setSelectedPromo(e.target.value)}
          >
            {promos.map((promo) => (
              <option key={promo} value={promo}>
                {promo}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text text-sm mb-2">Salle</span>
          <select
            className="select select-bordered w-full"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            {rooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text text-sm mb-2">Jour</span>
          <select
            className="select select-bordered w-full"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value as DayKey | 'Tous')}
          >
            <option value="Tous">Tous</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra table-fixed min-w-[900px]">
            <thead>
              <tr>
                <th className="w-32">Horaire</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((time) => (
                <tr key={time}>
                  <td className="font-semibold text-sm align-top">{time}</td>
                  {DAYS.map((day) => {
                    const sessions = scheduleMap.get(`${day}-${time}`) ?? [];

                    return (
                      <td key={`${day}-${time}`} className="align-top p-2">
                        <div className="space-y-2 min-h-[110px]">
                          {sessions.length === 0 ? (
                            <div className="text-[11px] text-base-content/40 border border-dashed border-base-300 rounded-lg p-2 text-center">
                              Libre
                            </div>
                          ) : (
                            sessions.map((session) => (
                              <div
                                key={session.id}
                                className={`rounded-xl border p-2 text-left ${TYPE_STYLES[session.type]}`}
                              >
                                <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                                  {session.type}
                                </div>
                                <div className="font-semibold text-sm leading-tight mt-1">{session.module}</div>
                                <div className="text-[11px] mt-1">{session.promo}</div>
                                <div className="text-[11px] opacity-80">{session.room}</div>
                                <div className="text-[11px] opacity-80">{session.teacher}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <div className="text-xs uppercase tracking-[0.2em] text-base-content/50">Vue</div>
            <div className="mt-2 text-lg font-bold">Planning hebdomadaire</div>
            <p className="text-sm text-base-content/70">
              Visualisation rapide par promotion, salle et jour. À étendre ensuite avec le générateur complet de timetable.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <div className="text-xs uppercase tracking-[0.2em] text-base-content/50">État</div>
            <div className="mt-2 text-lg font-bold">{filteredSessions.length} séances</div>
            <p className="text-sm text-base-content/70">Filtrées selon les critères sélectionnés.</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <div className="text-xs uppercase tracking-[0.2em] text-base-content/50">Prochaine étape</div>
            <div className="mt-2 text-lg font-bold">Importer le module complet</div>
            <p className="text-sm text-base-content/70">
              Le générateur complet de timetable peut ensuite être importé depuis le projet timetable original.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
