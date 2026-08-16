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

  @field('server_id') serverId?: string;
  @text('client_uuid') clientUuid!: string;
  @text('media_type') mediaType!: 'photo' | 'video';
  @text('context') context!: 'workout' | 'exercise' | 'diet_progress' | 'meal';
  @field('session_id') sessionId?: string;
  @field('entry_id') entryId?: string;
  @field('diet_log_id') dietLogId?: string;
  @field('meal_entry_id') mealEntryId?: string;
  @field('local_uri') localUri?: string;
  @field('remote_url') remoteUrl?: string;
  @field('file_size_bytes') fileSizeBytes!: number;
  @text('mime_type') mimeType!: string;
  @field('duration_sec') durationSec?: number;
  @field('pose_type') poseType?: 'front' | 'side' | 'back' | 'scan';
  @readonly @date('created_at') createdAt!: Date;
}
