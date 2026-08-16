-- ============================================================
-- GymTracker MVP — PostgreSQL Schema
-- Version: 1.0.0
-- All timestamps are UTC. All IDs are UUID v4.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE weight_unit       AS ENUM ('kg', 'lbs');
CREATE TYPE sync_status       AS ENUM ('pending', 'synced', 'failed');
CREATE TYPE media_type        AS ENUM ('photo', 'video');
CREATE TYPE media_context     AS ENUM ('workout', 'exercise', 'diet_progress', 'meal');
CREATE TYPE media_sync_status AS ENUM ('pending', 'uploaded', 'failed');
CREATE TYPE pose_type         AS ENUM ('front', 'side', 'back', 'scan');
CREATE TYPE meal_condition    AS ENUM ('bloated', 'high_energy', 'sluggish', 'brain_fog', 'neutral');
CREATE TYPE workout_condition AS ENUM ('high_energy', 'fatigued', 'joint_pain', 'poor_sleep', 'normal');
CREATE TYPE calendar_sync_status AS ENUM ('idle', 'syncing', 'failed');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    display_name        TEXT NOT NULL CHECK (length(display_name) BETWEEN 2 AND 50),
    weight_unit         weight_unit NOT NULL DEFAULT 'kg',
    -- Macro goals (stored with user for portability)
    goal_protein_g      INTEGER NOT NULL DEFAULT 0 CHECK (goal_protein_g >= 0),
    goal_carbs_g        INTEGER NOT NULL DEFAULT 0 CHECK (goal_carbs_g >= 0),
    goal_fat_g          INTEGER NOT NULL DEFAULT 0 CHECK (goal_fat_g >= 0),
    goal_calories       INTEGER NOT NULL DEFAULT 0 CHECK (goal_calories >= 0),
    -- Google Calendar
    gcal_connected          BOOLEAN NOT NULL DEFAULT false,
    gcal_calendar_id        TEXT,
    gcal_refresh_token_enc  TEXT,      -- AES-256 encrypted
    gcal_last_sync_at       TIMESTAMPTZ,
    gcal_sync_status        calendar_sync_status NOT NULL DEFAULT 'idle',
    gcal_error_message      TEXT,
    -- Refresh token management
    refresh_token_hash  TEXT,          -- bcrypt hash of current valid refresh token
    refresh_token_exp   TIMESTAMPTZ,
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ        -- soft delete
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- ============================================================
-- EXERCISES (Global library + user-custom)
-- ============================================================
CREATE TABLE exercises (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment    TEXT,
    is_custom    BOOLEAN NOT NULL DEFAULT false,
    created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Unique: same name can exist as system + custom per user
    UNIQUE NULLS NOT DISTINCT (name, created_by)
);

CREATE INDEX idx_exercises_name ON exercises USING GIN (to_tsvector('english', name));
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_created_by ON exercises(created_by) WHERE is_custom = true;

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
CREATE TABLE workout_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uuid     UUID NOT NULL UNIQUE,    -- Client-generated, idempotency key
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL,
    finished_at     TIMESTAMPTZ,
    notes           TEXT CHECK (length(notes) <= 2000),
    condition_tags  TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(condition_tags, 1) <= 10),
    sync_status     sync_status NOT NULL DEFAULT 'pending',
    client_timestamp TIMESTAMPTZ NOT NULL,    -- For conflict resolution
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraints
    CONSTRAINT valid_session_dates CHECK (finished_at IS NULL OR finished_at >= started_at)
);

CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX idx_workout_sessions_client_uuid ON workout_sessions(client_uuid);
CREATE INDEX idx_workout_sessions_sync ON workout_sessions(user_id, sync_status) WHERE sync_status != 'synced';

-- ============================================================
-- EXERCISE ENTRIES (An exercise within a session)
-- ============================================================
CREATE TABLE exercise_entries (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uuid  UUID NOT NULL UNIQUE,
    session_id   UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id  UUID NOT NULL REFERENCES exercises(id),
    order_index  INTEGER NOT NULL CHECK (order_index >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, order_index)
);

CREATE INDEX idx_exercise_entries_session ON exercise_entries(session_id);
CREATE INDEX idx_exercise_entries_exercise ON exercise_entries(exercise_id);

-- ============================================================
-- SETS
-- ============================================================
CREATE TABLE sets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uuid      UUID NOT NULL UNIQUE,    -- Idempotency key
    entry_id         UUID NOT NULL REFERENCES exercise_entries(id) ON DELETE CASCADE,
    set_number       INTEGER NOT NULL CHECK (set_number >= 1),
    weight           NUMERIC(7, 2) NOT NULL CHECK (weight >= 0 AND weight <= 1000),
    reps             INTEGER NOT NULL CHECK (reps >= 1 AND reps <= 100),
    rir              INTEGER NOT NULL CHECK (rir >= 0 AND rir <= 5),   -- CRITICAL: 0-5 enforced at DB
    notes            TEXT CHECK (length(notes) <= 500),
    client_timestamp TIMESTAMPTZ NOT NULL,
    sync_status      sync_status NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entry_id, set_number)
);

CREATE INDEX idx_sets_entry ON sets(entry_id);
CREATE INDEX idx_sets_client_uuid ON sets(client_uuid);

-- ============================================================
-- GHOST DATA CACHE (Denormalized for instant reads)
-- ============================================================
CREATE TABLE exercise_ghost_cache (
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id   UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    session_date  DATE NOT NULL,
    -- Snapshot stored as JSONB for flexibility
    sets_snapshot JSONB NOT NULL DEFAULT '[]',
    -- Example: [{"set_number":1,"weight":225,"reps":8,"rir":2}, ...]
    total_volume  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, exercise_id)
);

CREATE INDEX idx_ghost_cache_lookup ON exercise_ghost_cache(user_id, exercise_id);

-- Auto-update ghost cache via trigger
CREATE OR REPLACE FUNCTION update_ghost_cache()
RETURNS TRIGGER AS $$
DECLARE
    v_entry  exercise_entries%ROWTYPE;
    v_session workout_sessions%ROWTYPE;
    v_snapshot JSONB;
    v_volume NUMERIC;
BEGIN
    SELECT * INTO v_entry FROM exercise_entries WHERE id = NEW.entry_id;
    SELECT * INTO v_session FROM workout_sessions WHERE id = v_entry.session_id;

    SELECT
        jsonb_agg(
            jsonb_build_object(
                'set_number', s.set_number,
                'weight',     s.weight,
                'reps',       s.reps,
                'rir',        s.rir
            ) ORDER BY s.set_number
        ),
        SUM(s.weight * s.reps)
    INTO v_snapshot, v_volume
    FROM sets s
    WHERE s.entry_id = NEW.entry_id;

    INSERT INTO exercise_ghost_cache (user_id, exercise_id, session_date, sets_snapshot, total_volume, updated_at)
    VALUES (v_session.user_id, v_entry.exercise_id, v_session.date, COALESCE(v_snapshot, '[]'), COALESCE(v_volume, 0), NOW())
    ON CONFLICT (user_id, exercise_id) DO UPDATE
        SET sets_snapshot = EXCLUDED.sets_snapshot,
            session_date  = EXCLUDED.session_date,
            total_volume  = EXCLUDED.total_volume,
            updated_at    = NOW()
        -- Only update if this session is newer
        WHERE EXCLUDED.session_date >= exercise_ghost_cache.session_date;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_ghost_cache
AFTER INSERT OR UPDATE ON sets
FOR EACH ROW EXECUTE FUNCTION update_ghost_cache();

-- ============================================================
-- DIET LOGS
-- ============================================================
CREATE TABLE diet_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    body_weight  NUMERIC(5, 2) CHECK (body_weight > 0 AND body_weight < 500),
    weight_unit  weight_unit,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE INDEX idx_diet_logs_user_date ON diet_logs(user_id, date DESC);

-- ============================================================
-- MEAL ENTRIES
-- ============================================================
CREATE TABLE meal_entries (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uuid      UUID NOT NULL UNIQUE,
    diet_log_id      UUID NOT NULL REFERENCES diet_logs(id) ON DELETE CASCADE,
    label            TEXT NOT NULL CHECK (length(label) <= 200),
    protein_g        NUMERIC(6, 1) NOT NULL CHECK (protein_g >= 0),
    carbs_g          NUMERIC(6, 1) NOT NULL CHECK (carbs_g >= 0),
    fat_g            NUMERIC(6, 1) NOT NULL CHECK (fat_g >= 0),
    calories         NUMERIC(7, 1) NOT NULL CHECK (calories >= 0),
    condition_tag    meal_condition,
    logged_at        TIMESTAMPTZ NOT NULL,
    client_timestamp TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_entries_diet_log ON meal_entries(diet_log_id);

-- ============================================================
-- MEDIA RECORDS
-- ============================================================
CREATE TABLE media_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uuid     UUID NOT NULL UNIQUE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type      media_type NOT NULL,
    context         media_context NOT NULL,
    -- Foreign keys (one of these will be populated based on context)
    session_id      UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    entry_id        UUID REFERENCES exercise_entries(id) ON DELETE CASCADE,
    diet_log_id     UUID REFERENCES diet_logs(id) ON DELETE CASCADE,
    meal_entry_id   UUID REFERENCES meal_entries(id) ON DELETE CASCADE,
    -- File info
    local_uri       TEXT,                   -- Relative path on device
    remote_url      TEXT,                   -- Full R2 URL after upload
    r2_object_key   TEXT,                   -- R2 object key (for deletion)
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
    mime_type       TEXT NOT NULL,
    duration_sec    INTEGER CHECK (duration_sec > 0 AND duration_sec <= 60),  -- Videos only
    pose_type       pose_type,              -- Progress photos only
    sync_status     media_sync_status NOT NULL DEFAULT 'pending',
    -- Constraints
    CONSTRAINT media_size_photo CHECK (media_type != 'photo' OR file_size_bytes <= 10485760),   -- 10MB
    CONSTRAINT media_size_video CHECK (media_type != 'video' OR file_size_bytes <= 104857600),  -- 100MB
    CONSTRAINT media_duration_video CHECK (media_type != 'video' OR duration_sec IS NOT NULL),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_records_user ON media_records(user_id, created_at DESC);
CREATE INDEX idx_media_records_session ON media_records(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_media_records_diet_log ON media_records(diet_log_id) WHERE diet_log_id IS NOT NULL;
CREATE INDEX idx_media_records_sync ON media_records(user_id, sync_status) WHERE sync_status = 'pending';
CREATE INDEX idx_media_records_progress ON media_records(user_id, created_at DESC)
    WHERE context = 'diet_progress';

-- ============================================================
-- WEEKLY PLANS
-- ============================================================
CREATE TABLE weekly_plans (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_data  JSONB NOT NULL DEFAULT '[]',
    -- Example: [{"dayOfWeek":1,"label":"Push","exerciseIds":["uuid1","uuid2"]}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_diet_logs_updated_at       BEFORE UPDATE ON diet_logs        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_media_records_updated_at   BEFORE UPDATE ON media_records    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_weekly_plans_updated_at    BEFORE UPDATE ON weekly_plans     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SEED: Global Exercise Library (Sample)
-- ============================================================
INSERT INTO exercises (name, muscle_group, equipment, is_custom) VALUES
    ('Barbell Back Squat',         'quads',    'barbell',    false),
    ('Romanian Deadlift',          'hamstrings','barbell',   false),
    ('Barbell Bench Press',        'chest',    'barbell',    false),
    ('Incline Dumbbell Press',     'chest',    'dumbbell',   false),
    ('Barbell Row',                'back',     'barbell',    false),
    ('Lat Pulldown',               'back',     'cable',      false),
    ('Overhead Press',             'shoulders','barbell',    false),
    ('Lateral Raise',              'shoulders','dumbbell',   false),
    ('Barbell Curl',               'biceps',   'barbell',    false),
    ('Tricep Pushdown',            'triceps',  'cable',      false),
    ('Leg Press',                  'quads',    'machine',    false),
    ('Leg Curl',                   'hamstrings','machine',   false),
    ('Calf Raise',                 'calves',   'machine',    false),
    ('Pull Up',                    'back',     'bodyweight', false),
    ('Dip',                        'triceps',  'bodyweight', false),
    ('Cable Fly',                  'chest',    'cable',      false),
    ('Face Pull',                  'rear_delt','cable',      false),
    ('Hack Squat',                 'quads',    'machine',    false),
    ('Hip Thrust',                 'glutes',   'barbell',    false),
    ('Seated Cable Row',           'back',     'cable',      false);
