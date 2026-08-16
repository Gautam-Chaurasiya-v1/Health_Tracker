import { database } from '../db';
import MediaRecord from '../db/models/MediaRecord';
import { MediaContext, MediaType, PoseType, SyncStatus } from '../../../shared/types/enums';
import { MediaRecordEntity } from '../../../shared/types/entities';

export const MEDIA_LIMITS = {
  MAX_PHOTO_BYTES: 10 * 1024 * 1024,
  MAX_VIDEO_BYTES: 100 * 1024 * 1024,
  WARN_STORAGE_BYTES: 500 * 1024 * 1024,
  BLOCK_STORAGE_BYTES: 100 * 1024 * 1024,
};

export interface StorageCheckResult {
  allowed: boolean;
  warning: boolean;
  freeSpaceBytes: number;
  message?: string;
}

export const checkAvailableStorage = async (): Promise<StorageCheckResult> => {
  return {
    allowed: true,
    warning: false,
    freeSpaceBytes: 10 * 1024 * 1024 * 1024,
  };
};

export interface ProcessMediaParams {
  rawUri: string;
  type: MediaType;
  context: MediaContext;
  sessionId?: string;
  entryId?: string;
  dietLogId?: string;
  mealEntryId?: string;
  poseType?: PoseType;
  durationSec?: number;
}

export const processAndSaveMedia = async (
  params: ProcessMediaParams
): Promise<MediaRecordEntity> => {
  const { rawUri, type, context, sessionId, entryId, dietLogId, mealEntryId, poseType, durationSec } = params;

  const fileId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  let savedRecord: MediaRecordEntity | null = null;

  await database.write(async () => {
    const mediaCollection = database.get<MediaRecord>('media_records');
    const record = await mediaCollection.create((r) => {
      r.clientUuid = fileId;
      r.mediaType = type;
      r.context = context;
      r.sessionId = sessionId;
      r.entryId = entryId;
      r.dietLogId = dietLogId;
      r.mealEntryId = mealEntryId;
      r.localUri = rawUri;
      r.fileSizeBytes = 500000;
      r.mimeType = type === MediaType.Photo ? 'image/jpeg' : 'video/mp4';
      r.durationSec = durationSec;
      r.poseType = poseType;
    });

    savedRecord = {
      id: record.id,
      client_uuid: fileId,
      media_type: type,
      context,
      session_id: sessionId,
      entry_id: entryId,
      diet_log_id: dietLogId,
      meal_entry_id: mealEntryId,
      local_uri: rawUri,
      file_size_bytes: 500000,
      mime_type: type === MediaType.Photo ? 'image/jpeg' : 'video/mp4',
      duration_sec: durationSec,
      pose_type: poseType,
      sync_status: SyncStatus.Pending,
      created_at: now.getTime(),
    };
  });

  return savedRecord!;
};

export const deleteLocalMedia = async (mediaId: string): Promise<void> => {
  await database.write(async () => {
    const mediaCollection = database.get<MediaRecord>('media_records');
    const record = await mediaCollection.find(mediaId);
    await record.destroyPermanently();
  });
};
