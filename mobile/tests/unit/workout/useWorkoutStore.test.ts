import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { database } from '../../../src/db';
import WorkoutSession from '../../../src/db/models/WorkoutSession';
import ExerciseEntry from '../../../src/db/models/ExerciseEntry';
import Set from '../../../src/db/models/Set';
import { WorkoutCondition } from '../../../../shared/types/enums';

describe('useWorkoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.getState().reset();
  });

  it('startSession() creates a WorkoutSession in DB with correct date', async () => {
    const today = '2026-08-17';
    const sessionId = await useWorkoutStore.getState().startSession(today);

    expect(sessionId).toBeTruthy();
    expect(useWorkoutStore.getState().activeSessionId).toBe(sessionId);

    const session = await database.collections.get<WorkoutSession>('workout_sessions').find(sessionId);
    expect(session.date).toBe(today);
    expect(session.startedAt).toBeGreaterThan(0);
    expect(session.finishedAt).toBeFalsy();
  });

  it('logSet() writes Set to DB with correct entry_id', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const entryId = await useWorkoutStore.getState().addExerciseEntry(sessionId, 'ex-test-1');

    await useWorkoutStore.getState().logSet(entryId, 'ex-test-1', {
      weight: 100,
      reps: 8,
      rir: 2,
    });

    const sets = await database.collections.get<Set>('sets').query().fetch();
    const loggedSet = sets.find((s) => s.entryId === entryId);

    expect(loggedSet).toBeDefined();
    expect(loggedSet?.weight).toBe(100);
    expect(loggedSet?.reps).toBe(8);
    expect(loggedSet?.rir).toBe(2);
    expect(loggedSet?.setNumber).toBe(1);
  });

  it('logSet() throws when rir = 6', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const entryId = await useWorkoutStore.getState().addExerciseEntry(sessionId, 'ex-test-2');

    await expect(
      useWorkoutStore.getState().logSet(entryId, 'ex-test-2', {
        weight: 100,
        reps: 8,
        rir: 6,
      })
    ).rejects.toThrow('RIR must be between 0 and 5');
  });

  it('logSet() throws when rir = -1', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const entryId = await useWorkoutStore.getState().addExerciseEntry(sessionId, 'ex-test-3');

    await expect(
      useWorkoutStore.getState().logSet(entryId, 'ex-test-3', {
        weight: 100,
        reps: 8,
        rir: -1,
      })
    ).rejects.toThrow('RIR must be between 0 and 5');
  });

  it('logSet() does NOT throw when rir = 0 or rir = 5', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const entryId = await useWorkoutStore.getState().addExerciseEntry(sessionId, 'ex-test-4');

    await expect(
      useWorkoutStore.getState().logSet(entryId, 'ex-test-4', {
        weight: 100,
        reps: 5,
        rir: 0,
      })
    ).resolves.not.toThrow();

    await expect(
      useWorkoutStore.getState().logSet(entryId, 'ex-test-4', {
        weight: 100,
        reps: 5,
        rir: 5,
      })
    ).resolves.not.toThrow();
  });

  it('finishSession() sets finished_at to current timestamp', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    await useWorkoutStore.getState().finishSession(sessionId);

    const session = await database.collections.get<WorkoutSession>('workout_sessions').find(sessionId);
    expect(session.finishedAt).toBeDefined();
    expect(session.finishedAt).toBeGreaterThan(0);
    expect(useWorkoutStore.getState().activeSessionId).toBeNull();
  });

  it('setConditionTags() accepts up to 10 tags', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const tags = [
      WorkoutCondition.HIGH_ENERGY,
      WorkoutCondition.NORMAL,
      WorkoutCondition.FATIGUED,
    ];

    await useWorkoutStore.getState().setConditionTags(sessionId, tags);

    const session = await database.collections.get<WorkoutSession>('workout_sessions').find(sessionId);
    expect(session.conditionTags).toBe(JSON.stringify(tags));
  });

  it('setConditionTags() truncates/rejects more than 10 tags', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const tags = Array(11).fill(WorkoutCondition.HIGH_ENERGY);

    await expect(useWorkoutStore.getState().setConditionTags(sessionId, tags)).rejects.toThrow(
      'Maximum 10 condition tags allowed'
    );
  });

  it('deleteSet() removes the set and re-indexes remaining sets', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const entryId = await useWorkoutStore.getState().addExerciseEntry(sessionId, 'ex-delete-test');

    await useWorkoutStore.getState().logSet(entryId, 'ex-delete-test', { weight: 80, reps: 10, rir: 2 });
    await useWorkoutStore.getState().logSet(entryId, 'ex-delete-test', { weight: 85, reps: 8, rir: 1 });
    await useWorkoutStore.getState().logSet(entryId, 'ex-delete-test', { weight: 90, reps: 6, rir: 0 });

    const setsBefore = await database.get<Set>('sets').query().fetch();
    const entrySets = setsBefore.filter((s) => s.entryId === entryId);
    expect(entrySets.length).toBe(3);

    // Delete set #2 (index 1)
    const set2 = entrySets.find((s) => s.setNumber === 2);
    expect(set2).toBeDefined();

    await useWorkoutStore.getState().deleteSet(set2!.id, entryId, 'ex-delete-test');

    const setsAfter = await database.get<Set>('sets').query().fetch();
    const remaining = setsAfter.filter((s) => s.entryId === entryId).sort((a, b) => a.setNumber - b.setNumber);

    expect(remaining.length).toBe(2);
    expect(remaining[0].setNumber).toBe(1);
    expect(remaining[0].weight).toBe(80);
    expect(remaining[1].setNumber).toBe(2); // re-indexed from 3 to 2
    expect(remaining[1].weight).toBe(90);
  });

  it('deleteSession() removes the session and cascade-deletes entries and sets', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const entryId = await useWorkoutStore.getState().addExerciseEntry(sessionId, 'ex-session-delete');
    await useWorkoutStore.getState().logSet(entryId, 'ex-session-delete', { weight: 100, reps: 5, rir: 2 });

    await useWorkoutStore.getState().deleteSession(sessionId);

    const sessionExists = await database.get<WorkoutSession>('workout_sessions').query().fetch();
    expect(sessionExists.find((s) => s.id === sessionId)).toBeUndefined();

    const entryExists = await database.get<ExerciseEntry>('exercise_entries').query().fetch();
    expect(entryExists.find((e) => e.id === entryId)).toBeUndefined();
  });

  it('selectedDate defaults to today and setSelectedDate updates it', async () => {
    const today = new Date().toISOString().split('T')[0];
    expect(useWorkoutStore.getState().selectedDate).toBe(today);

    await useWorkoutStore.getState().setSelectedDate('2026-08-10');
    expect(useWorkoutStore.getState().selectedDate).toBe('2026-08-10');
  });

  it('loadSessionForDate() finds existing session for the requested date', async () => {
    const targetDate = '2026-08-12';
    const sessionId = await useWorkoutStore.getState().startSession(targetDate);
    const entryId = await useWorkoutStore.getState().addExerciseEntry(sessionId, 'ex-date-test');

    // Deselect active session
    useWorkoutStore.getState().setActiveSessionId(null);
    expect(useWorkoutStore.getState().activeSessionId).toBeNull();

    // Now load for date
    const session = await useWorkoutStore.getState().loadSessionForDate(targetDate);
    expect(session).toBeDefined();
    expect(session?.id).toBe(sessionId);
    expect(useWorkoutStore.getState().activeSessionId).toBe(sessionId);
    expect(useWorkoutStore.getState().activeExerciseEntryId).toBe(entryId);
  });

  it('loadSessionForDate() sets activeSessionId to null when no session exists', async () => {
    await useWorkoutStore.getState().setSelectedDate('2025-01-01');
    const session = await useWorkoutStore.getState().loadSessionForDate('2025-01-01');
    expect(session).toBeNull();
    expect(useWorkoutStore.getState().activeSessionId).toBeNull();
  });
});

