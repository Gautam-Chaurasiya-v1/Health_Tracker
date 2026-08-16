import { create } from 'zustand';
import { Q } from '@nozbe/watermelondb';
import uuid from 'react-native-uuid';
import { database } from '../db';
import WorkoutSession from '../db/models/WorkoutSession';
import ExerciseEntry from '../db/models/ExerciseEntry';
import Set from '../db/models/Set';
import ExerciseGhostCache from '../db/models/ExerciseGhostCache';
import { WorkoutCondition } from '../../../shared/types/enums';
import { GhostSnapshot } from '../../../shared/types/entities';
import { useGhostStore } from './useGhostStore';

export interface SetData {
  weight: number;
  reps: number;
  rir: number;
  notes?: string;
}

export interface WorkoutState {
  activeSessionId: string | null;
  activeExerciseEntryId: string | null;
  activeExerciseId: string | null;
  isLoading: boolean;

  startSession: (date?: string) => Promise<string>;
  finishSession: (sessionId: string) => Promise<void>;
  addExerciseEntry: (sessionId: string, exerciseId: string) => Promise<string>;
  logSet: (entryId: string, exerciseId: string, data: SetData) => Promise<void>;
  updateNotes: (sessionId: string, notes: string) => Promise<void>;
  setConditionTags: (sessionId: string, tags: WorkoutCondition[]) => Promise<void>;
  setActiveSessionId: (id: string | null) => void;
  setActiveExerciseEntryId: (id: string | null) => void;
  setActiveExerciseId: (id: string | null) => void;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeSessionId: null,
  activeExerciseEntryId: null,
  activeExerciseId: null,
  isLoading: false,

  setActiveSessionId: (id: string | null) => set({ activeSessionId: id }),
  setActiveExerciseEntryId: (id: string | null) => set({ activeExerciseEntryId: id }),
  setActiveExerciseId: (id: string | null) => set({ activeExerciseId: id }),

  startSession: async (sessionDate?: string) => {
    const todayIso = sessionDate || new Date().toISOString().split('T')[0];
    const clientUuid = uuid.v4().toString();
    const now = Date.now();

    let createdSessionId = '';

    await database.write(async () => {
      const sessionCollection = database.collections.get<WorkoutSession>('workout_sessions');
      const session = await sessionCollection.create((record: WorkoutSession) => {
        record.clientUuid = clientUuid;
        record.date = todayIso;
        record.startedAt = now;
        record.clientTimestamp = now;
      });
      createdSessionId = session.id;
    });

    set({ activeSessionId: createdSessionId });
    return createdSessionId;
  },

  finishSession: async (sessionId: string) => {
    const now = Date.now();
    await database.write(async () => {
      const sessionCollection = database.collections.get<WorkoutSession>('workout_sessions');
      const session = await sessionCollection.find(sessionId);
      await session.update((record: WorkoutSession) => {
        record.finishedAt = now;
        record.clientTimestamp = now;
      });
    });

    if (get().activeSessionId === sessionId) {
      set({ activeSessionId: null, activeExerciseEntryId: null, activeExerciseId: null });
    }
  },

  addExerciseEntry: async (sessionId: string, exerciseId: string) => {
    const clientUuid = uuid.v4().toString();
    const now = Date.now();

    let createdEntryId = '';

    await database.write(async () => {
      const entriesCollection = database.collections.get<ExerciseEntry>('exercise_entries');
      const existingEntries = await entriesCollection.query(Q.where('session_id', sessionId)).fetch();
      const orderIndex = existingEntries.length;

      const entry = await entriesCollection.create((record: ExerciseEntry) => {
        record.clientUuid = clientUuid;
        record.sessionId = sessionId;
        record.exerciseId = exerciseId;
        record.orderIndex = orderIndex;
      });
      createdEntryId = entry.id;
    });

    set({ activeExerciseEntryId: createdEntryId, activeExerciseId: exerciseId });
    return createdEntryId;
  },

  logSet: async (entryId: string, exerciseId: string, data: SetData) => {
    const { weight, reps, rir, notes } = data;

    if (rir < 0 || rir > 5) {
      throw new Error('RIR must be between 0 and 5');
    }
    if (reps < 1 || reps > 100) {
      throw new Error('Reps must be 1-100');
    }
    if (weight < 0) {
      throw new Error('Weight cannot be negative');
    }

    const clientUuid = uuid.v4().toString();
    const now = Date.now();

    await database.write(async () => {
      const setsCollection = database.collections.get<Set>('sets');
      const existingSets = await setsCollection.query(Q.where('entry_id', entryId)).fetch();
      const setNumber = existingSets.length + 1;

      await setsCollection.create((record: Set) => {
        record.clientUuid = clientUuid;
        record.entryId = entryId;
        record.setNumber = setNumber;
        record.weight = weight;
        record.reps = reps;
        record.rir = rir;
        if (notes !== undefined) record.notes = notes;
        record.clientTimestamp = now;
      });

      // Update Ghost Data Snapshot
      const entriesCollection = database.collections.get<ExerciseEntry>('exercise_entries');
      const currentEntry = await entriesCollection.find(entryId);
      const sessionCollection = database.collections.get<WorkoutSession>('workout_sessions');
      const currentSession = await sessionCollection.find(currentEntry.sessionId);
      const sessionDate = currentSession.date;

      const allSets = await setsCollection
        .query(Q.where('entry_id', entryId))
        .fetch();

      const sortedSets = allSets.sort((a, b) => a.setNumber - b.setNumber);
      const mappedSets = sortedSets.map((s) => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        rir: s.rir,
      }));

      const totalVolume = mappedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

      const snapshot: GhostSnapshot = {
        sessionDate,
        sets: mappedSets,
        totalVolume,
      };

      // Ghost cache in WatermelonDB
      const ghostCacheCollection = database.collections.get<ExerciseGhostCache>('exercise_ghost_cache');
      const existingCache = await ghostCacheCollection.query(Q.where('exercise_id', exerciseId)).fetch();

      if (existingCache.length > 0) {
        const cached = existingCache[0];
        if (sessionDate >= cached.sessionDate) {
          await cached.update((record: ExerciseGhostCache) => {
            record.sessionDate = sessionDate;
            record.setsSnapshot = JSON.stringify(mappedSets);
            record.totalVolume = totalVolume;
            record.updatedAt = now;
          });
          useGhostStore.getState().updateCache(exerciseId, snapshot);
        }
      } else {
        await ghostCacheCollection.create((record: ExerciseGhostCache) => {
          record.exerciseId = exerciseId;
          record.sessionDate = sessionDate;
          record.setsSnapshot = JSON.stringify(mappedSets);
          record.totalVolume = totalVolume;
          record.updatedAt = now;
        });
        useGhostStore.getState().updateCache(exerciseId, snapshot);
      }
    });
  },

  updateNotes: async (sessionId: string, notes: string) => {
    const now = Date.now();
    await database.write(async () => {
      const sessionCollection = database.collections.get<WorkoutSession>('workout_sessions');
      const session = await sessionCollection.find(sessionId);
      await session.update((record: WorkoutSession) => {
        record.notes = notes;
        record.clientTimestamp = now;
      });
    });
  },

  setConditionTags: async (sessionId: string, tags: WorkoutCondition[]) => {
    if (tags.length > 10) {
      throw new Error('Maximum 10 condition tags allowed');
    }

    const now = Date.now();
    await database.write(async () => {
      const sessionCollection = database.collections.get<WorkoutSession>('workout_sessions');
      const session = await sessionCollection.find(sessionId);
      await session.update((record: WorkoutSession) => {
        record.conditionTags = JSON.stringify(tags);
        record.clientTimestamp = now;
      });
    });
  },

  reset: () => {
    set({
      activeSessionId: null,
      activeExerciseEntryId: null,
      activeExerciseId: null,
      isLoading: false,
    });
  },
}));
