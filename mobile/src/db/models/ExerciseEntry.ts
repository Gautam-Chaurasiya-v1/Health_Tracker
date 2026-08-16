import { Model } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';
import WorkoutSession from './WorkoutSession';
import Exercise from './Exercise';
import Set from './Set';

export default class ExerciseEntry extends Model {
  static table = 'exercise_entries';

  static associations = {
    workout_sessions: { type: 'belongs_to' as const, key: 'session_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
    sets: { type: 'has_many' as const, foreignKey: 'entry_id' },
  };

  // @ts-ignore
  @field('server_id') serverId?: string;
  // @ts-ignore
  @field('client_uuid') clientUuid: string;
  // @ts-ignore
  @field('session_id') sessionId: string;
  // @ts-ignore
  @field('exercise_id') exerciseId: string;
  // @ts-ignore
  @field('order_index') orderIndex: number;

  // @ts-ignore
  @relation('workout_sessions', 'session_id') session: any;
  // @ts-ignore
  @relation('exercises', 'exercise_id') exercise: any;
  // @ts-ignore
  @children('sets') sets: any;
}
