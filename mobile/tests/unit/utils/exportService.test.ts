import {
  buildBackupPayload,
  estimateBackupSize,
  exportFullBackupJSON,
  generateWorkoutCSV,
  exportWorkoutCSV,
} from '../../../src/utils/exportService';
import { database } from '../../../src/db';
import RNFS from 'react-native-fs';
import * as Sharing from 'expo-sharing';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true),
}));

describe('exportService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('builds backup payload containing expected collections', async () => {
    const payload = await buildBackupPayload();
    expect(payload.version).toBe('1.0.0');
    expect(payload.exportedAt).toBeTruthy();
    expect(payload.data).toBeDefined();
    expect(Array.isArray(payload.data.user_preferences)).toBe(true);
    expect(Array.isArray(payload.data.diet_logs)).toBe(true);
    expect(Array.isArray(payload.data.meal_entries)).toBe(true);
  });

  it('estimates backup size', async () => {
    const sizeStr = await estimateBackupSize();
    expect(sizeStr).toBeTruthy();
  });

  it('writes JSON backup file and triggers sharing', async () => {
    const result = await exportFullBackupJSON();
    expect(result.filePath).toContain('.json');
    expect(RNFS.writeFile).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('generates CSV headers and exports CSV file', async () => {
    const csvStr = await generateWorkoutCSV();
    expect(csvStr).toContain('date,exercise_name,set_number,weight,weight_unit,reps,rir,notes');

    const result = await exportWorkoutCSV();
    expect(result.filePath).toContain('.csv');
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });
});
