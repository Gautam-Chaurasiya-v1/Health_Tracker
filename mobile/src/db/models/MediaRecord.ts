import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export default class MediaRecord extends Model {
  static table = 'media_records';

  static associations = {
    workout_sessions: { type: 'belongs_to' as const, key: 'session_id' },
    exercise_entries: { type: 'belongs_to' as const, key: 'entry_id' },
    diet_logs: { type: 'belongs_to' as const, key: 'diet_log_id' },
    meal_entries: { type: 'belongs_to' as const, key: 'meal_entry_id' },
  };

  // @ts-ignore
  @field('server_id') serverId?: string;
  // @ts-ignore
  @text('client_uuid') clientUuid: string;
  // @ts-ignore
  @text('media_type') mediaType: 'photo' | 'video';
  // @ts-ignore
  @text('context') context: 'workout' | 'exercise' | 'diet_progress' | 'meal';
  // @ts-ignore
  @field('session_id') sessionId?: string;
  // @ts-ignore
  @field('entry_id') entryId?: string;
  // @ts-ignore
  @field('diet_log_id') dietLogId?: string;
  // @ts-ignore
  @field('meal_entry_id') mealEntryId?: string;
  // @ts-ignore
  @field('local_uri') localUri?: string;
  // @ts-ignore
  @field('remote_url') remoteUrl?: string;
  // @ts-ignore
  @field('file_size_bytes') fileSizeBytes: number;
  // @ts-ignore
  @text('mime_type') mimeType: string;
  // @ts-ignore
  @field('duration_sec') durationSec?: number;
  // @ts-ignore
  @field('pose_type') poseType?: 'front' | 'side' | 'back' | 'scan';
  // @ts-ignore
  @readonly @date('created_at') createdAt: Date;
}
