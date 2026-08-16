import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import ExerciseEntry from './ExerciseEntry';

export default class Set extends Model {
  static table = 'sets';

  static associations = {
    exercise_entries: { type: 'belongs_to' as const, key: 'entry_id' },
  };

  // @ts-ignore
  @field('server_id') serverId?: string;
  // @ts-ignore
  @field('client_uuid') clientUuid: string;
  // @ts-ignore
  @field('entry_id') entryId: string;
  // @ts-ignore
  @field('set_number') setNumber: number;
  // @ts-ignore
  @field('weight') weight: number;
  // @ts-ignore
  @field('reps') reps: number;
  // @ts-ignore
  @field('rir') rir: number;
  // @ts-ignore
  @field('notes') notes?: string;
  // @ts-ignore
  @field('client_timestamp') clientTimestamp: number;

  // @ts-ignore
  @relation('exercise_entries', 'entry_id') exerciseEntry: any;
}
