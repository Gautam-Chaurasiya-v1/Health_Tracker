import { renderHook, act } from '@testing-library/react-native';
import { database } from '../../../src/db';
import ExerciseGhostCache from '../../../src/db/models/ExerciseGhostCache';
import { useGhostStore } from '../../../src/stores/useGhostStore';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { useGhostData } from '../../../src/hooks/useGhostData';
import { GhostSnapshot } from '../../../../shared/types/entities';

describe('useGhostData hook', () => {
  beforeEach(async () => {
    useGhostStore.getState().clearCache();
    useWorkoutStore.getState().reset();
  });

  it('Returns null when no cache entry exists', () => {
    const { result } = renderHook(() => useGhostData('non-existent-ex'));
    expect(result.current).toBeNull();
  });

  it('Returns GhostSnapshot when cache entry exists in memory', () => {
    const snapshot: GhostSnapshot = {
      sessionDate: '2026-08-10',
      sets: [{ setNumber: 1, weight: 100, reps: 5, rir: 2 }],
      totalVolume: 500,
    };
    useGhostStore.getState().updateCache('ex-test-mem', snapshot);

    const { result } = renderHook(() => useGhostData('ex-test-mem'));
    expect(result.current).toEqual(snapshot);
  });

  it('Returns data within 50ms from mount', async () => {
    const snapshot: GhostSnapshot = {
      sessionDate: '2026-08-10',
      sets: [{ setNumber: 1, weight: 100, reps: 5, rir: 2 }],
      totalVolume: 500,
    };
    useGhostStore.getState().updateCache('ex-speed-test', snapshot);

    const start = Date.now();
    const { result } = renderHook(() => useGhostData('ex-speed-test'));
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
    expect(result.current).toEqual(snapshot);
  });

  it('Correctly parses sets_snapshot and updates from WatermelonDB record', async () => {
    const exerciseId = 'ex-db-test-1';
    const rawSets = [
      { setNumber: 1, weight: 120, reps: 6, rir: 1 },
      { setNumber: 2, weight: 120, reps: 5, rir: 0 },
    ];

    await database.write(async () => {
      const collection = database.collections.get<ExerciseGhostCache>('exercise_ghost_cache');
      await collection.create((record) => {
        record.exerciseId = exerciseId;
        record.sessionDate = '2026-08-12';
        record.setsSnapshot = JSON.stringify(rawSets);
        record.totalVolume = 120 * 6 + 120 * 5;
        record.updatedAt = Date.now();
      });
    });

    const { result } = renderHook(() => useGhostData(exerciseId));

    // Fast check or reactive wait
    expect(result.current?.totalVolume).toBe(1320);
    expect(result.current?.sets.length).toBe(2);
  });

  it('Cache update logic: only updates if new date >= cached date', async () => {
    const exerciseId = 'ex-date-order';
    const sessionId1 = await useWorkoutStore.getState().startSession('2026-08-15');
    const entryId1 = await useWorkoutStore.getState().addExerciseEntry(sessionId1, exerciseId);

    // Log set on Aug 15
    await useWorkoutStore.getState().logSet(entryId1, exerciseId, {
      weight: 100,
      reps: 5,
      rir: 2,
    });

    let snap = useGhostStore.getState().getSnapshot(exerciseId);
    expect(snap?.sessionDate).toBe('2026-08-15');

    // Attempt to log an older set on Aug 10 (should NOT overwrite cache)
    const sessionIdOld = await useWorkoutStore.getState().startSession('2026-08-10');
    const entryIdOld = await useWorkoutStore.getState().addExerciseEntry(sessionIdOld, exerciseId);

    await useWorkoutStore.getState().logSet(entryIdOld, exerciseId, {
      weight: 80,
      reps: 5,
      rir: 2,
    });

    snap = useGhostStore.getState().getSnapshot(exerciseId);
    expect(snap?.sessionDate).toBe('2026-08-15');

    // Log on same-day or newer (Aug 17) -> DOES update cache
    const sessionIdNew = await useWorkoutStore.getState().startSession('2026-08-17');
    const entryIdNew = await useWorkoutStore.getState().addExerciseEntry(sessionIdNew, exerciseId);

    await useWorkoutStore.getState().logSet(entryIdNew, exerciseId, {
      weight: 110,
      reps: 5,
      rir: 2,
    });

    snap = useGhostStore.getState().getSnapshot(exerciseId);
    expect(snap?.sessionDate).toBe('2026-08-17');
    expect(snap?.sets[0].weight).toBe(110);
  });
});
