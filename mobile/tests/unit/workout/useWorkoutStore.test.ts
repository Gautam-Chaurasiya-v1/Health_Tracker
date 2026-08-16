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
});
