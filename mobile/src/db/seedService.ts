import { Database } from '@nozbe/watermelondb';
import Exercise from './models/Exercise';
import exerciseSeedData from '../data/exercises.json';

/**
 * Runs on first app launch. Checks if exercises table is empty.
 * If empty: inserts all 20 exercises from exercises.json.
 * If not empty: skips (idempotent).
 */
export async function seedExercisesIfEmpty(db: Database): Promise<void> {
  const exerciseCollection = db.collections.get<Exercise>('exercises');
  const count = await exerciseCollection.query().fetchCount();
  if (count > 0) return;

  await db.write(async () => {
    for (const ex of exerciseSeedData) {
      await exerciseCollection.create((record: Exercise) => {
        record.name = ex.name;
        record.muscleGroup = ex.muscle_group;
        record.equipment = ex.equipment ?? '';
        record.isCustom = false;
      });
    }
  });
}
