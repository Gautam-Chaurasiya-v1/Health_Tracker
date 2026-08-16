import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';

import UserPreferences from './models/UserPreferences';
import DietLog from './models/DietLog';
import MealEntry from './models/MealEntry';
import MediaRecord from './models/MediaRecord';
import Exercise from './models/Exercise';
import WorkoutSession from './models/WorkoutSession';
import ExerciseEntry from './models/ExerciseEntry';
import Set from './models/Set';
import ExerciseGhostCache from './models/ExerciseGhostCache';

export const modelClasses = [
  UserPreferences,
  DietLog,
  MealEntry,
  MediaRecord,
  Exercise,
  WorkoutSession,
  ExerciseEntry,
  Set,
  ExerciseGhostCache,
];

export function createDatabase(useMemory = false): Database {
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
    dbName: useMemory ? `test_db_${Date.now()}_${Math.random()}` : 'gymtracker_web_db',
  });

  return new Database({ adapter, modelClasses });
}

export const database = createDatabase();
