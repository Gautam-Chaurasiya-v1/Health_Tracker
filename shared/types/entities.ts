import { MealCondition, WorkoutCondition, PoseType, WeightUnit, MediaContext, MediaType, SyncStatus } from './enums';

export interface UserPreferencesEntity {
  id: string;
  display_name: string;
  weight_unit: WeightUnit;
  protein_goal_g: number;
  carbs_goal_g: number;
  fats_goal_g: number;
  calories_goal: number;
  onboarding_complete: boolean;
  created_at: number;
  updated_at: number;
}

export interface DietLogEntity {
  id: string;
  server_id?: string | null;
  serverId?: string | null;
  date: string; // ISO date string YYYY-MM-DD
  body_weight?: number | null;
  weight_unit?: WeightUnit | null;
  sync_status: SyncStatus;
}

export interface MealEntryEntity {
  id: string;
  server_id?: string | null;
  client_uuid: string;
  diet_log_id: string;
  label: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
  condition_tag?: MealCondition | null;
  meal_photo_id?: string | null;
  logged_at: number;
  client_timestamp: number;
  sync_status: SyncStatus;
}

export interface MediaRecordEntity {
  id: string;
  server_id?: string | null;
  client_uuid: string;
  media_type: MediaType;
  context: MediaContext;
  session_id?: string | null;
  entry_id?: string | null;
  diet_log_id?: string | null;
  meal_entry_id?: string | null;
  local_uri?: string | null;
  remote_url?: string | null;
  file_size_bytes: number;
  mime_type: string;
  duration_sec?: number | null;
  pose_type?: PoseType | null;
  sync_status: SyncStatus;
  created_at: number;
}

export interface ExerciseEntity {
  id: string;
  server_id?: string | null;
  name: string;
  muscle_group: string;
  equipment?: string | null;
  is_custom: boolean;
  created_by?: string | null;
  synced_at?: number | null;
}

export interface GhostSnapshot {
  sessionDate: string;
  sets: Array<{ setNumber: number; weight: number; reps: number; rir: number }>;
  totalVolume: number;
}

export interface WorkoutSessionEntity {
  id: string;
  server_id?: string | null;
  client_uuid: string;
  date: string;
  started_at: number;
  finished_at?: number | null;
  notes?: string | null;
  condition_tags?: WorkoutCondition[] | string | null;
  sync_status: SyncStatus;
  client_timestamp: number;
}

export interface ExerciseEntryEntity {
  id: string;
  server_id?: string | null;
  client_uuid: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  sync_status: SyncStatus;
}

export interface SetEntity {
  id: string;
  server_id?: string | null;
  client_uuid: string;
  entry_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number;
  notes?: string | null;
  client_timestamp: number;
  sync_status: SyncStatus;
}

export interface BackupDataStructure {
  version: string;
  exportedAt: string;
  data: {
    user_preferences?: UserPreferencesEntity[];
    diet_logs?: DietLogEntity[];
    meal_entries?: MealEntryEntity[];
    media_records?: MediaRecordEntity[];
    exercises?: ExerciseEntity[];
    workout_sessions?: WorkoutSessionEntity[];
    exercise_entries?: ExerciseEntryEntity[];
    sets?: SetEntity[];
    exercise_ghost_cache?: any[];
  };
}
