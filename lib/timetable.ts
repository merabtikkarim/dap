import { Prisma } from '@prisma/client';

export const WEEK_DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const DEFAULT_TIME_SLOTS = [
  { start: '08:00', end: '09:30' },
  { start: '09:30', end: '11:00' },
  { start: '11:00', end: '12:30' },
  { start: '14:00', end: '15:30' },
  { start: '15:30', end: '17:00' },
] as const;

export function parseMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return parseMinutes(startA) < parseMinutes(endB) && parseMinutes(startB) < parseMinutes(endA);
}

export function isCompatibleRoomType(roomType?: string | null, courseType?: string | null) {
  if (!roomType || !courseType) return true;
  const normalizedRoom = roomType.toLowerCase();
  const normalizedCourse = courseType.toLowerCase();

  if (normalizedCourse === 'cm') return ['amphi', 'amphitheatre', 'cours', 'salle'].includes(normalizedRoom);
  if (normalizedCourse === 'td') return ['td', 'salle', 'amphi', 'informatique'].includes(normalizedRoom);
  if (normalizedCourse === 'tp') return ['tp', 'laboratoire', 'informatique', 'salle'].includes(normalizedRoom);

  return true;
}

export function normalizeValue(value: string | null | undefined) {
  return value?.trim() ?? '';
}

export type ConstraintCheckInput = {
  day: string;
  start: string;
  end: string;
  teacherId?: string | null;
  roomId?: string | null;
  existingSeances: Array<{
    id: string;
    jour: string;
    heureDebut: string;
    heureFin: string;
    enseignantId?: string | null;
    salleId?: string | null;
  }>;
  teacherRestrictions: Array<{
    jour: string;
    heureDebut: string;
    heureFin: string;
  }>;
  roomRestrictions: Array<{
    jour: string;
    heureDebut: string;
    heureFin: string;
  }>;
  roomType?: string | null;
  courseType?: string | null;
};

export function checkSchedulingConstraints(input: ConstraintCheckInput) {
  const { day, start, end, teacherId, roomId, existingSeances, teacherRestrictions, roomRestrictions, roomType, courseType } = input;

  if (!isCompatibleRoomType(roomType, courseType)) {
    return { valid: false, reason: `La salle n'est pas compatible avec le type de cours (${courseType})` };
  }

  if (teacherId) {
    const teacherConflict = existingSeances.some((seance) => {
      if (seance.enseignantId !== teacherId) return false;
      return seance.jour === day && overlaps(seance.heureDebut, seance.heureFin, start, end);
    });

    if (teacherConflict) {
      return { valid: false, reason: 'L’enseignant est déjà affecté à une séance au même créneau.' };
    }

    const teacherBlocked = teacherRestrictions.some((restriction) => {
      return restriction.jour === day && overlaps(restriction.heureDebut, restriction.heureFin, start, end);
    });

    if (teacherBlocked) {
      return { valid: false, reason: 'L’enseignant est indisponible sur ce créneau.' };
    }
  }

  if (roomId) {
    const roomConflict = existingSeances.some((seance) => {
      if (seance.salleId !== roomId) return false;
      return seance.jour === day && overlaps(seance.heureDebut, seance.heureFin, start, end);
    });

    if (roomConflict) {
      return { valid: false, reason: 'La salle est déjà occupée à ce créneau.' };
    }

    const roomBlocked = roomRestrictions.some((restriction) => {
      return restriction.jour === day && overlaps(restriction.heureDebut, restriction.heureFin, start, end);
    });

    if (roomBlocked) {
      return { valid: false, reason: 'La salle est indisponible sur ce créneau.' };
    }
  }

  return { valid: true };
}

export async function generatePlanningFromSeances(params: {
  seances: Array<{
    id: string;
    module: string;
    type: string;
    jour?: string | null;
    heureDebut?: string | null;
    heureFin?: string | null;
    groupe: string;
    filiere?: string | null;
    semestre?: number | null;
    enseignantId?: string | null;
    salleId?: string | null;
  }>;
  teachers: Array<{ id: string; maxCoursParJour?: number | null; maxHeuresParSemaine?: number | null }>;
  rooms: Array<{ id: string; type?: string | null; capacite?: number | null }>;
  existingSeances: Array<{
    id: string;
    jour: string;
    heureDebut: string;
    heureFin: string;
    enseignantId?: string | null;
    salleId?: string | null;
  }>;
  teacherRestrictions: Array<{ enseignantId?: string | null; jour: string; heureDebut: string; heureFin: string }>;
  roomRestrictions: Array<{ salleId?: string | null; jour: string; heureDebut: string; heureFin: string }>;
}) {
  const { seances, teachers, rooms, existingSeances, teacherRestrictions, roomRestrictions } = params;

  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const roomMap = new Map(rooms.map((room) => [room.id, room]));
  const teacherBlockedMap = new Map<string, Array<{ jour: string; heureDebut: string; heureFin: string }>>();
  const roomBlockedMap = new Map<string, Array<{ jour: string; heureDebut: string; heureFin: string }>>();

  for (const restriction of teacherRestrictions) {
    if (!restriction.enseignantId) continue;
    const list = teacherBlockedMap.get(restriction.enseignantId) ?? [];
    list.push({ jour: restriction.jour, heureDebut: restriction.heureDebut, heureFin: restriction.heureFin });
    teacherBlockedMap.set(restriction.enseignantId, list);
  }

  for (const restriction of roomRestrictions) {
    if (!restriction.salleId) continue;
    const list = roomBlockedMap.get(restriction.salleId) ?? [];
    list.push({ jour: restriction.jour, heureDebut: restriction.heureDebut, heureFin: restriction.heureFin });
    roomBlockedMap.set(restriction.salleId, list);
  }

  const planned: Array<{ seanceId: string; day: string; start: string; end: string; roomId: string | null; teacherId: string | null; reason?: string }> = [];
  const conflicts: Array<{ seanceId: string; module: string; reason: string }> = [];

  for (const seance of seances) {
    const candidateDays = seance.jour ? [seance.jour] : [...WEEK_DAYS];
    const preferredStart = seance.heureDebut ?? '08:00';
    const preferredEnd = seance.heureFin ?? '09:30';
    let assigned = false;

    for (const day of candidateDays) {
      const slotCandidates = DEFAULT_TIME_SLOTS.map((slot) => ({
        start: slot.start,
        end: slot.end,
      }));

      const effectiveStart = preferredStart && preferredEnd ? { start: preferredStart, end: preferredEnd } : null;

      const choices = effectiveStart ? [{ start: effectiveStart.start, end: effectiveStart.end }, ...slotCandidates.filter((slot) => slot.start !== effectiveStart.start)] : slotCandidates;

      for (const slot of choices) {
        const relevantRooms = rooms.filter((room) => {
          if (seance.salleId && room.id !== seance.salleId) return false;
          if (!room.id) return false;
          return isCompatibleRoomType(room.type, seance.type);
        });

        for (const room of relevantRooms) {
          const plannedTeacher = seance.enseignantId ? teacherMap.get(seance.enseignantId) : null;
          const teacherId = seance.enseignantId ?? null;

          const teacherCheck = checkSchedulingConstraints({
            day,
            start: slot.start,
            end: slot.end,
            teacherId,
            roomId: room.id,
            existingSeances,
            teacherRestrictions: teacherId ? teacherBlockedMap.get(teacherId) ?? [] : [],
            roomRestrictions: roomBlockedMap.get(room.id) ?? [],
            roomType: room.type,
            courseType: seance.type,
          });

          if (!teacherCheck.valid) {
            continue;
          }

          if (plannedTeacher && plannedTeacher.maxCoursParJour) {
            const countForDay = planned.filter((item) => item.teacherId === teacherId && item.day === day).length;
            if (countForDay >= plannedTeacher.maxCoursParJour) {
              continue;
            }
          }

          const assignedRoom = room.id;
          planned.push({
            seanceId: seance.id,
            day,
            start: slot.start,
            end: slot.end,
            roomId: assignedRoom,
            teacherId,
          });
          assigned = true;
          break;
        }

        if (assigned) break;
      }

      if (assigned) break;
    }

    if (!assigned) {
      conflicts.push({
        seanceId: seance.id,
        module: seance.module,
        reason: 'Aucun créneau compatible trouvé pour cette séance avec les contraintes actuelles.',
      });
    }
  }

  return { planned, conflicts };
}

export function toPrismaEnumValue(value: string | null | undefined) {
  return value ?? 'LUNDI';
}

export function buildConflictSummary(conflicts: Array<{ module: string; reason: string }>) {
  return conflicts.map((conflict) => `${conflict.module}: ${conflict.reason}`).join('\n');
}

export const TIMETABLE_DEFAULT_OPTIONS = {
  minDurationMinutes: 90,
  maxDaysPerWeek: 5,
};
