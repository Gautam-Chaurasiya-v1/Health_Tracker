import { validateBackupJSON, restoreBackup } from '../../../src/utils/importService';
import { database } from '../../../src/db';

const mockBackup = {
  version: '1.0.0',
  exportedAt: new Date().toISOString(),
  data: {
    user_preferences: [
      {
        id: 'pref-1',
        display_name: 'Jordan',
        weight_unit: 'kg',
        protein_goal_g: 160,
        carbs_goal_g: 200,
        fats_goal_g: 60,
        calories_goal: 2000,
        onboarding_complete: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ],
    diet_logs: [
      {
        id: 'log-101',
        date: '2026-08-16',
        body_weight: 78.5,
        weight_unit: 'kg',
        sync_status: 'pending',
      },
    ],
    meal_entries: [
      {
        id: 'meal-101',
        client_uuid: 'unique-uuid-101',
        diet_log_id: 'log-101',
        label: 'Oats & Protein',
        protein_g: 40,
        carbs_g: 60,
        fat_g: 10,
        calories: 490,
        logged_at: Date.now(),
        client_timestamp: Date.now(),
        sync_status: 'pending',
      },
    ],
  },
};

describe('importService', () => {
  beforeEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('validates a correct backup JSON string', () => {
    const res = validateBackupJSON(JSON.stringify(mockBackup));
    expect(res.valid).toBe(true);
    expect(res.version).toBe('1.0.0');
    expect(res.recordCounts['meal_entries']).toBe(1);
  });

  it('rejects invalid JSON or missing metadata', () => {
    const res = validateBackupJSON('{"broken": true}');
    expect(res.valid).toBe(false);
    expect(res.errorMessage).toBeTruthy();
  });

  it('restores backup and deduplicates existing records', async () => {
    // First restore
    const firstResult = await restoreBackup(mockBackup as any);
    expect(firstResult.insertedCount).toBeGreaterThan(0);
    expect(firstResult.skippedCount).toBe(0);

    // Second restore with identical data should skip all duplicates
    const secondResult = await restoreBackup(mockBackup as any);
    expect(secondResult.insertedCount).toBe(0);
    expect(secondResult.skippedCount).toBeGreaterThan(0);
  });
});
