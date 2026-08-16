/**
 * WatermelonDB Client-Side Schema
 * Mirrors the PostgreSQL server schema for offline-first operation.
 * Owner: Developer 2 (Frontend)
 * 
 * Note: WatermelonDB uses SQLite under the hood.
 * All server UUID fields are stored as strings.
 * Timestamps are stored as Unix ms (number).
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const gymTrackerSchema = appSchema({
  version: 1,
  tables: [

    // ─── Exercises ────────────────────────────────────────────────────
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'server_id',    type: 'string', isOptional: true },  // UUID from server after sync
        { name: 'name',         type: 'string' },
        { name: 'muscle_group', type: 'string' },
        { name: 'equipment',    type: 'string', isOptional: true },
        { name: 'is_custom',    type: 'boolean' },
        { name: 'created_by',   type: 'string', isOptional: true },  // userId if custom
        { name: 'synced_at',    type: 'number', isOptional: true },
      ],
    }),

    // ─── Exercise Ghost Cache ────────────────────────────────────────
    // Keyed by (user_id, exercise_id) — always read locally during workouts
    tableSchema({
      name: 'exercise_ghost_cache',
      columns: [
        { name: 'exercise_id',    type: 'string' },  // references exercises.id (local)
        { name: 'session_date',   type: 'string' },  // ISO date string YYYY-MM-DD
        { name: 'sets_snapshot',  type: 'string' },  // JSON string: [{set_number, weight, reps, rir}]
        { name: 'total_volume',   type: 'number' },
        { name: 'updated_at',     type: 'number' },  // Unix ms
      ],
    }),

    // ─── Workout Sessions ────────────────────────────────────────────
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'server_id',        type: 'string', isOptional: true },
        { name: 'client_uuid',      type: 'string' },   // uuid() on creation
        { name: 'date',             type: 'string' },   // ISO date
        { name: 'started_at',       type: 'number' },   // Unix ms
        { name: 'finished_at',      type: 'number', isOptional: true },
        { name: 'notes',            type: 'string', isOptional: true },
        { name: 'condition_tags',   type: 'string', isOptional: true },  // JSON array string
        { name: 'sync_status',      type: 'string' },   // 'pending' | 'synced' | 'failed'
        { name: 'client_timestamp', type: 'number' },   // Unix ms, for conflict resolution
      ],
    }),

    // ─── Exercise Entries (exercise within a session) ─────────────────
    tableSchema({
      name: 'exercise_entries',
      columns: [
        { name: 'server_id',    type: 'string', isOptional: true },
        { name: 'client_uuid',  type: 'string' },
        { name: 'session_id',   type: 'string' },   // references workout_sessions.id (local)
        { name: 'exercise_id',  type: 'string' },   // references exercises.id (local)
        { name: 'order_index',  type: 'number' },
        { name: 'sync_status',  type: 'string' },
      ],
    }),

    // ─── Sets ─────────────────────────────────────────────────────────
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'server_id',        type: 'string', isOptional: true },
        { name: 'client_uuid',      type: 'string' },
        { name: 'entry_id',         type: 'string' },  // references exercise_entries.id (local)
        { name: 'set_number',       type: 'number' },
        { name: 'weight',           type: 'number' },
        { name: 'reps',             type: 'number' },
        { name: 'rir',              type: 'number' },  // 0–5; validate in app layer
        { name: 'notes',            type: 'string', isOptional: true },
        { name: 'client_timestamp', type: 'number' },
        { name: 'sync_status',      type: 'string' },
      ],
    }),

    // ─── Diet Logs ────────────────────────────────────────────────────
    tableSchema({
      name: 'diet_logs',
      columns: [
        { name: 'server_id',    type: 'string', isOptional: true },
        { name: 'date',         type: 'string' },   // ISO date, unique per user per day
        { name: 'body_weight',  type: 'number', isOptional: true },
        { name: 'weight_unit',  type: 'string', isOptional: true },  // 'kg' | 'lbs'
        { name: 'sync_status',  type: 'string' },
      ],
    }),

    // ─── Meal Entries ─────────────────────────────────────────────────
    tableSchema({
      name: 'meal_entries',
      columns: [
        { name: 'server_id',        type: 'string', isOptional: true },
        { name: 'client_uuid',      type: 'string' },
        { name: 'diet_log_id',      type: 'string' },  // references diet_logs.id (local)
        { name: 'label',            type: 'string' },
        { name: 'protein_g',        type: 'number' },
        { name: 'carbs_g',          type: 'number' },
        { name: 'fat_g',            type: 'number' },
        { name: 'calories',         type: 'number' },
        { name: 'condition_tag',    type: 'string', isOptional: true },
        { name: 'meal_photo_id',    type: 'string', isOptional: true },  // references media_records.id
        { name: 'logged_at',        type: 'number' },
        { name: 'client_timestamp', type: 'number' },
        { name: 'sync_status',      type: 'string' },
      ],
    }),

    // ─── Media Records ────────────────────────────────────────────────
    tableSchema({
      name: 'media_records',
      columns: [
        { name: 'server_id',      type: 'string', isOptional: true },
        { name: 'client_uuid',    type: 'string' },
        { name: 'media_type',     type: 'string' },   // 'photo' | 'video'
        { name: 'context',        type: 'string' },   // 'workout' | 'exercise' | 'diet_progress' | 'meal'
        // FK references (one populated per context)
        { name: 'session_id',     type: 'string', isOptional: true },
        { name: 'entry_id',       type: 'string', isOptional: true },
        { name: 'diet_log_id',    type: 'string', isOptional: true },
        { name: 'meal_entry_id',  type: 'string', isOptional: true },
        // File info
        { name: 'local_uri',      type: 'string', isOptional: true },   // Device filesystem path
        { name: 'remote_url',     type: 'string', isOptional: true },   // R2 URL after upload
        { name: 'file_size_bytes',type: 'number' },
        { name: 'mime_type',      type: 'string' },
        { name: 'duration_sec',   type: 'number', isOptional: true },
        { name: 'pose_type',      type: 'string', isOptional: true },   // 'front' | 'side' | 'back' | 'scan'
        { name: 'sync_status',    type: 'string' },   // 'pending' | 'uploaded' | 'failed'
        { name: 'created_at',     type: 'number' },
      ],
    }),

    // ─── Sync Queue (for tracking pending sync events) ───────────────
    // A lightweight log of client-side events not yet confirmed by server.
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'client_uuid',   type: 'string' },   // UUID of the record to sync
        { name: 'entity_type',   type: 'string' },   // 'workout_session' | 'set' | 'diet_log' | 'meal_entry' | 'media_record'
        { name: 'operation',     type: 'string' },   // 'create' | 'update' | 'delete'
        { name: 'payload',       type: 'string' },   // JSON stringified entity snapshot
        { name: 'created_at',    type: 'number' },
        { name: 'retry_count',   type: 'number' },
        { name: 'last_error',    type: 'string', isOptional: true },
      ],
    }),

  ],
});

/**
 * Schema Migration — v1 (initial)
 * When bumping schema version, add a new migration object here.
 */
export const gymTrackerMigrations = {
  migrations: [
    // v1 is the initial schema, no migrations needed yet.
    // Future format:
    // {
    //   toVersion: 2,
    //   steps: [
    //     addColumns({ table: 'sets', columns: [{ name: 'new_field', type: 'string' }] }),
    //   ],
    // },
  ],
};
