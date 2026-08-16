import { createDatabase } from '../../../src/db';
import { seedExercisesIfEmpty } from '../../../src/db/seedService';
import Exercise from '../../../src/db/models/Exercise';

describe('seedService', () => {
  it('seedExercisesIfEmpty() inserts 20 exercises on empty DB', async () => {
    const db = createDatabase(true);
    const exerciseCollection = db.collections.get<Exercise>('exercises');

    const initialCount = await exerciseCollection.query().fetchCount();
    expect(initialCount).toBe(0);

    await seedExercisesIfEmpty(db);

    const postSeedCount = await exerciseCollection.query().fetchCount();
    expect(postSeedCount).toBe(20);
  });

  it('seedExercisesIfEmpty() is idempotent (second call: still 20, not 40)', async () => {
    const db = createDatabase(true);
    const exerciseCollection = db.collections.get<Exercise>('exercises');

    await seedExercisesIfEmpty(db);
    const firstCallCount = await exerciseCollection.query().fetchCount();
    expect(firstCallCount).toBe(20);

    await seedExercisesIfEmpty(db);
    const secondCallCount = await exerciseCollection.query().fetchCount();
    expect(secondCallCount).toBe(20);
  });

  it('All seeded exercises have a non-empty muscle_group', async () => {
    const db = createDatabase(true);
    const exerciseCollection = db.collections.get<Exercise>('exercises');

    await seedExercisesIfEmpty(db);
    const exercises = await exerciseCollection.query().fetch();

    expect(exercises.length).toBe(20);
    for (const ex of exercises) {
      expect(ex.name).toBeTruthy();
      expect(ex.muscleGroup).toBeTruthy();
      expect(typeof ex.muscleGroup).toBe('string');
      expect(ex.muscleGroup.trim().length).toBeGreaterThan(0);
      expect(ex.isCustom).toBe(false);
    }
  });
});
