import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class ExerciseGhostCache extends Model {
  static table = 'exercise_ghost_cache';

  // @ts-ignore
  @field('exercise_id') exerciseId: string;
  // @ts-ignore
  @field('session_date') sessionDate: string;
  // @ts-ignore
  @field('sets_snapshot') setsSnapshot: string;
  // @ts-ignore
  @field('total_volume') totalVolume: number;
  // @ts-ignore
  @field('updated_at') updatedAt: number;
}
