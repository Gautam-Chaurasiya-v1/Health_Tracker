import { database } from '../db';
import { BackupDataStructure } from '../../../shared/types/entities';
import { format } from 'date-fns';

export const buildBackupPayload = async (): Promise<BackupDataStructure> => {
  const collections = [
    'user_preferences',
    'diet_logs',
    'meal_entries',
    'media_records',
    'exercises',
    'workout_sessions',
    'exercise_entries',
    'sets',
    'exercise_ghost_cache',
  ];

  const data: Record<string, any[]> = {};

  for (const colName of collections) {
    try {
      const records = await database.get(colName).query().fetch();
      data[colName] = records.map((r) => (r as any)._raw);
    } catch {
      data[colName] = [];
    }
  }

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: data as any,
  };
};

export const estimateBackupSize = async (): Promise<string> => {
  try {
    const payload = await buildBackupPayload();
    const jsonStr = JSON.stringify(payload);
    const bytes = jsonStr.length;
    const mb = bytes / (1024 * 1024);
    if (mb < 0.1) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  } catch {
    return '< 1 MB';
  }
};

const triggerBrowserDownload = (content: string, filename: string, mimeType: string) => {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportFullBackupJSON = async (): Promise<{ filePath: string }> => {
  const payload = await buildBackupPayload();
  const jsonStr = JSON.stringify(payload, null, 2);
  const dateStr = format(new Date(), 'yyyy-MM-dd-HHmm');
  const fileName = `gymtracker-backup-${dateStr}.json`;

  triggerBrowserDownload(jsonStr, fileName, 'application/json');
  return { filePath: fileName };
};

export const generateWorkoutCSV = async (): Promise<string> => {
  const header = 'date,exercise_name,set_number,weight,weight_unit,reps,rir,notes\n';
  let rows = '';

  try {
    const sets = await database.get('sets').query().fetch();
    const entries = await database.get('exercise_entries').query().fetch();
    const sessions = await database.get('workout_sessions').query().fetch();
    const exercises = await database.get('exercises').query().fetch();

    const exerciseMap = new Map(exercises.map((e: any) => [e.id, e.name]));
    const sessionMap = new Map(sessions.map((s: any) => [s.id, s.date]));
    const entryMap = new Map(
      entries.map((e: any) => [
        e.id,
        {
          date: sessionMap.get(e.sessionId) || '',
          exerciseName: exerciseMap.get(e.exerciseId) || 'Unknown Exercise',
        },
      ])
    );

    for (const set of sets as any[]) {
      const entryInfo = entryMap.get(set.entryId) || { date: '', exerciseName: 'Exercise' };
      const row = `"${entryInfo.date}","${entryInfo.exerciseName}",${set.setNumber || 1},${set.weight || 0},"kg",${set.reps || 0},${set.rir || 0},"${(set.notes || '').replace(/"/g, '""')}"\n`;
      rows += row;
    }
  } catch (err) {
    console.error('Error generating workout CSV:', err);
  }

  return header + rows;
};

export const exportWorkoutCSV = async (): Promise<{ filePath: string }> => {
  const csvContent = await generateWorkoutCSV();
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `gymtracker-workouts-${dateStr}.csv`;

  triggerBrowserDownload(csvContent, fileName, 'text/csv');
  return { filePath: fileName };
};
