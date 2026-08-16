import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { Platform } from 'react-native';
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
  if (useMemory || Platform.OS === 'web' || process.env.NODE_ENV === 'test') {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
      dbName: useMemory ? `test_db_${Date.now()}_${Math.random()}` : undefined,
    });
    return new Database({ adapter, modelClasses });
  }

  try {
    const adapter = new SQLiteAdapter({
      schema,
      jsi: false,
      onSetUpError: (error) => {
        console.warn('WatermelonDB SQLite setup warning, falling back to LokiJS:', error);
      },
    });

    return new Database({ adapter, modelClasses });
  } catch (err) {
    console.warn('Native SQLiteAdapter not available in Expo Go, using LokiJS fallback adapter:', err);
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
    });
    return new Database({ adapter, modelClasses });
  }
}

export const database = createDatabase();
