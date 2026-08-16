import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { Platform } from 'react-native';
import { schema } from './schema';

import UserPreferences from './models/UserPreferences';
import DietLog from './models/DietLog';
import MealEntry from './models/MealEntry';
import MediaRecord from './models/MediaRecord';

// For web/tests vs native SQLite
let adapter;

if (Platform.OS === 'web' || process.env.NODE_ENV === 'test') {
  adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
} else {
  adapter = new SQLiteAdapter({
    schema,
    jsi: false,
    onSetUpError: (error) => {
      console.error('WatermelonDB SQLite setup error:', error);
    },
  });
}

export const database = new Database({
  adapter,
  modelClasses: [
    UserPreferences,
    DietLog,
    MealEntry,
    MediaRecord,
  ],
});
