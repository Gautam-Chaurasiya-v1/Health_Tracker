import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // ─── User Preferences (Dev B) ──────────────────────────────────────
    tableSchema({
      name: 'user_preferences',
      columns: [
        { name: 'display_name',        type: 'string' },
        { name: 'weight_unit',         type: 'string' },  // 'kg' | 'lbs'
        { name: 'protein_goal_g',      type: 'number' },
        { name: 'carbs_goal_g',        type: 'number' },
        { name: 'fats_goal_g',         type: 'number' },
        { name: 'calories_goal',       type: 'number' },
        { name: 'onboarding_complete', type: 'boolean' },
        { name: 'created_at',          type: 'number' },  // Unix ms
        { name: 'updated_at',          type: 'number' },  // Unix ms
      ],
    }),

    // ─── Diet Logs (Dev B) ────────────────────────────────────────────
    tableSchema({
      name: 'diet_logs',
      columns: [
        { name: 'server_id',    type: 'string', isOptional: true },
        { name: 'date',         type: 'string' },   // ISO date YYYY-MM-DD
        { name: 'body_weight',  type: 'number', isOptional: true },
        { name: 'weight_unit',  type: 'string', isOptional: true },
        { name: 'sync_status',  type: 'string' },
      ],
    }),

    // ─── Meal Entries (Dev B) ─────────────────────────────────────────
    tableSchema({
      name: 'meal_entries',
      columns: [
        { name: 'server_id',        type: 'string', isOptional: true },
        { name: 'client_uuid',      type: 'string' },
        { name: 'diet_log_id',      type: 'string' },  // references diet_logs.id
        { name: 'label',            type: 'string' },
        { name: 'protein_g',        type: 'number' },
        { name: 'carbs_g',          type: 'number' },
        { name: 'fat_g',            type: 'number' },
        { name: 'calories',         type: 'number' },
        { name: 'condition_tag',    type: 'string', isOptional: true },
        { name: 'meal_photo_id',    type: 'string', isOptional: true },
        { name: 'logged_at',        type: 'number' },
        { name: 'client_timestamp', type: 'number' },
        { name: 'sync_status',      type: 'string' },
      ],
    }),

    // ─── Media Records (Dev B) ────────────────────────────────────────
    tableSchema({
      name: 'media_records',
      columns: [
        { name: 'server_id',      type: 'string', isOptional: true },
        { name: 'client_uuid',    type: 'string' },
        { name: 'media_type',     type: 'string' },   // 'photo' | 'video'
        { name: 'context',        type: 'string' },   // 'workout' | 'exercise' | 'diet_progress' | 'meal'
        { name: 'session_id',     type: 'string', isOptional: true },
        { name: 'entry_id',       type: 'string', isOptional: true },
        { name: 'diet_log_id',    type: 'string', isOptional: true },
        { name: 'meal_entry_id',  type: 'string', isOptional: true },
        { name: 'local_uri',      type: 'string', isOptional: true },
        { name: 'remote_url',     type: 'string', isOptional: true },
        { name: 'file_size_bytes',type: 'number' },
        { name: 'mime_type',      type: 'string' },
        { name: 'duration_sec',   type: 'number', isOptional: true },
        { name: 'pose_type',      type: 'string', isOptional: true },   // 'front' | 'side' | 'back' | 'scan'
        { name: 'sync_status',    type: 'string' },
        { name: 'created_at',     type: 'number' },
      ],
    }),

    // ─── Exercises (Dev A) ────────────────────────────────────────────
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'server_id',    type: 'string', isOptional: true },
        { name: 'name',         type: 'string' },
        { name: 'muscle_group', type: 'string' },
        { name: 'equipment',    type: 'string', isOptional: true },
        { name: 'is_custom',    type: 'boolean' },
        { name: 'created_by',   type: 'string', isOptional: true },
        { name: 'synced_at',    type: 'number', isOptional: true },
      ],
    }),

    // ─── Exercise Ghost Cache (Dev A) ────────────────────────────────
    tableSchema({
      name: 'exercise_ghost_cache',
      columns: [
        { name: 'exercise_id',    type: 'string' },
        { name: 'session_date',   type: 'string' },
        { name: 'sets_snapshot',  type: 'string' },
        { name: 'total_volume',   type: 'number' },
        { name: 'updated_at',     type: 'number' },
      ],
    }),

    // ─── Workout Sessions (Dev A) ────────────────────────────────────
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'server_id',        type: 'string', isOptional: true },
        { name: 'client_uuid',      type: 'string' },
        { name: 'date',             type: 'string' },
        { name: 'started_at',       type: 'number' },
        { name: 'finished_at',      type: 'number', isOptional: true },
        { name: 'notes',            type: 'string', isOptional: true },
        { name: 'condition_tags',   type: 'string', isOptional: true },
        { name: 'sync_status',      type: 'string' },
        { name: 'client_timestamp', type: 'number' },
      ],
    }),

    // ─── Exercise Entries (Dev A) ────────────────────────────────────
    tableSchema({
      name: 'exercise_entries',
      columns: [
        { name: 'server_id',    type: 'string', isOptional: true },
        { name: 'client_uuid',  type: 'string' },
        { name: 'session_id',   type: 'string' },
        { name: 'exercise_id',  type: 'string' },
        { name: 'order_index',  type: 'number' },
        { name: 'sync_status',  type: 'string' },
      ],
    }),

    // ─── Sets (Dev A) ────────────────────────────────────────────────
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'server_id',        type: 'string', isOptional: true },
        { name: 'client_uuid',      type: 'string' },
        { name: 'entry_id',         type: 'string' },
        { name: 'set_number',       type: 'number' },
        { name: 'weight',           type: 'number' },
        { name: 'reps',             type: 'number' },
        { name: 'rir',              type: 'number' },
        { name: 'notes',            type: 'string', isOptional: true },
        { name: 'client_timestamp', type: 'number' },
        { name: 'sync_status',      type: 'string' },
      ],
    }),

    // ─── Sync Queue ──────────────────────────────────────────────────
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'client_uuid',   type: 'string' },
        { name: 'entity_type',   type: 'string' },
        { name: 'operation',     type: 'string' },
        { name: 'payload',       type: 'string' },
        { name: 'created_at',    type: 'number' },
        { name: 'retry_count',   type: 'number' },
        { name: 'last_error',    type: 'string', isOptional: true },
      ],
    }),
  ],
});
