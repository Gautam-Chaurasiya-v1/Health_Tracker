import { create } from 'zustand';
import { database } from '../db';
import MediaRecord from '../db/models/MediaRecord';
import { MediaContext, MediaType, PoseType, SyncStatus } from '../../../shared/types/enums';
import { MediaRecordEntity } from '../../../shared/types/entities';
import { processAndSaveMedia, deleteLocalMedia, ProcessMediaParams } from '../services/mediaStorage';

export interface MediaState {
  mediaList: MediaRecordEntity[];
  isLoading: boolean;
  selectedPoseFilter: PoseType | 'all';

  // Actions
  setPoseFilter: (pose: PoseType | 'all') => void;
  loadMediaByContext: (context: MediaContext, filterId?: string) => Promise<void>;
  captureMedia: (params: ProcessMediaParams) => Promise<MediaRecordEntity>;
  deleteMedia: (mediaId: string) => Promise<void>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  mediaList: [],
  isLoading: false,
  selectedPoseFilter: 'all',

  setPoseFilter: (pose: PoseType | 'all') => {
    set({ selectedPoseFilter: pose });
  },

  loadMediaByContext: async (context: MediaContext, filterId?: string) => {
    set({ isLoading: true });
    try {
      const records = await database.get<MediaRecord>('media_records').query().fetch();
      let filtered = records.filter((r) => r.context === context);

      if (filterId) {
        if (context === MediaContext.Workout) {
          filtered = filtered.filter((r) => r.sessionId === filterId);
        } else if (context === MediaContext.Exercise) {
          filtered = filtered.filter((r) => r.entryId === filterId);
        } else if (context === MediaContext.DietProgress) {
          filtered = filtered.filter((r) => r.dietLogId === filterId);
        } else if (context === MediaContext.Meal) {
          filtered = filtered.filter((r) => r.mealEntryId === filterId);
        }
      }

      // Sort reverse chronological
      const mapped: MediaRecordEntity[] = filtered
        .map((r) => ({
          id: r.id,
          serverId: r.serverId,
          client_uuid: r.clientUuid,
          media_type: r.mediaType as MediaType,
          context: r.context as MediaContext,
          session_id: r.sessionId,
          entry_id: r.entryId,
          diet_log_id: r.dietLogId,
          meal_entry_id: r.mealEntryId,
          local_uri: r.localUri,
          remote_url: r.remoteUrl,
          file_size_bytes: r.fileSizeBytes,
          mime_type: r.mimeType,
          duration_sec: r.durationSec,
          pose_type: r.poseType as PoseType,
          sync_status: SyncStatus.Pending,
          created_at: r.createdAt ? r.createdAt.getTime() : Date.now(),
        }))
        .sort((a, b) => b.created_at - a.created_at);

      set({ mediaList: mapped });
    } catch (err) {
      console.error('Failed to load media records:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  captureMedia: async (params: ProcessMediaParams) => {
    set({ isLoading: true });
    try {
      const record = await processAndSaveMedia(params);
      set((state) => ({
        mediaList: [record, ...state.mediaList],
      }));
      return record;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMedia: async (mediaId: string) => {
    await deleteLocalMedia(mediaId);
    set((state) => ({
      mediaList: state.mediaList.filter((m) => m.id !== mediaId),
    }));
  },
}));
