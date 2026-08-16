import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Exercise extends Model {
  static table = 'exercises';

  // @ts-ignore
  @field('server_id') serverId?: string;
  // @ts-ignore
  @field('name') name: string;
  // @ts-ignore
  @field('muscle_group') muscleGroup: string;
  // @ts-ignore
  @field('equipment') equipment?: string;
  // @ts-ignore
  @field('is_custom') isCustom: boolean;
  // @ts-ignore
  @field('created_by') createdBy?: string;
  // @ts-ignore
  @field('synced_at') syncedAt?: number;
}
