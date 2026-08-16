import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';
import ExerciseEntry from './ExerciseEntry';

export default class WorkoutSession extends Model {
  static table = 'workout_sessions';

  static associations = {
    exercise_entries: { type: 'has_many' as const, foreignKey: 'session_id' },
  };

  // @ts-ignore
  @field('server_id') serverId?: string;
  // @ts-ignore
  @field('client_uuid') clientUuid: string;
  // @ts-ignore
  @field('date') date: string;
  // @ts-ignore
  @field('started_at') startedAt: number;
  // @ts-ignore
  @field('finished_at') finishedAt?: number;
  // @ts-ignore
  @field('notes') notes?: string;
  // @ts-ignore
  @field('condition_tags') conditionTags?: string;
  // @ts-ignore
  @field('client_timestamp') clientTimestamp: number;

  // @ts-ignore
  @children('exercise_entries') exerciseEntries: any;
}
