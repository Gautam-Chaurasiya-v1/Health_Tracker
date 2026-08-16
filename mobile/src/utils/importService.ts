import { database } from '../db';
import { BackupDataStructure } from '../../../shared/types/entities';

export interface ImportValidationResult {
  valid: boolean;
  version?: string;
  exportedAt?: string;
  errorMessage?: string;
  recordCounts: Record<string, number>;
}

export interface RestoreResult {
  insertedCount: number;
  skippedCount: number;
  byCollection: Record<string, { inserted: number; skipped: number }>;
}

export const validateBackupJSON = (jsonString: string): ImportValidationResult => {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, errorMessage: 'Invalid JSON file.', recordCounts: {} };
    }

    if (!parsed.version || !parsed.exportedAt || !parsed.data) {
      return {
        valid: false,
        errorMessage: 'Missing required backup metadata fields (version, exportedAt, data).',
        recordCounts: {},
      };
    }

    const counts: Record<string, number> = {};
    for (const [key, val] of Object.entries(parsed.data)) {
      if (Array.isArray(val)) {
        counts[key] = val.length;
      }
    }

    return {
      valid: true,
      version: parsed.version,
      exportedAt: parsed.exportedAt,
      recordCounts: counts,
    };
  } catch (err: any) {
    return {
      valid: false,
      errorMessage: `JSON parse error: ${err.message}`,
      recordCounts: {},
    };
  }
};

export const restoreBackup = async (
  backupPayload: BackupDataStructure | string
): Promise<RestoreResult> => {
  const payload: BackupDataStructure =
    typeof backupPayload === 'string' ? JSON.parse(backupPayload) : backupPayload;

  const data = payload.data || {};
  let totalInserted = 0;
  let totalSkipped = 0;
  const byCollection: Record<string, { inserted: number; skipped: number }> = {};

  const collectionNames = Object.keys(data);

  for (const colName of collectionNames) {
    const rawList = (data as any)[colName];
    if (!Array.isArray(rawList) || rawList.length === 0) continue;

    byCollection[colName] = { inserted: 0, skipped: 0 };

    try {
      const collection = database.get(colName);
      const existingRecords = await collection.query().fetch();

      const existingUuids = new Set<string>();
      const existingIds = new Set<string>();

      for (const rec of existingRecords as any[]) {
        if (rec.id) existingIds.add(rec.id);
        if (rec.clientUuid) existingUuids.add(rec.clientUuid);
        if (rec._raw?.client_uuid) existingUuids.add(rec._raw.client_uuid);
      }

      const recordsToInsert: any[] = [];

      for (const rawItem of rawList) {
        const itemUuid = rawItem.client_uuid || rawItem.clientUuid;
        const itemId = rawItem.id;

        const isDuplicate =
          (itemUuid && existingUuids.has(itemUuid)) ||
          (itemId && existingIds.has(itemId));

        if (isDuplicate) {
          byCollection[colName].skipped += 1;
          totalSkipped += 1;
        } else {
          recordsToInsert.push(rawItem);
        }
      }

      // Batch insert in groups of 100 as required by AGENTS.md
      const BATCH_SIZE = 100;
      for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
        const batchChunk = recordsToInsert.slice(i, i + BATCH_SIZE);

        await database.write(async () => {
          const preparedModels = batchChunk.map((item) =>
            collection.prepareCreate((record: any) => {
              record._raw = { ...item };
            })
          );
          await database.batch(...preparedModels);
        });

        byCollection[colName].inserted += batchChunk.length;
        totalInserted += batchChunk.length;
      }
    } catch (err) {
      console.error(`Failed restoring collection ${colName}:`, err);
    }
  }

  return {
    insertedCount: totalInserted,
    skippedCount: totalSkipped,
    byCollection,
  };
};
