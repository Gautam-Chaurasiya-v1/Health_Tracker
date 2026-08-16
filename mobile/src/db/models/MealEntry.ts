import { Model } from '@nozbe/watermelondb';
import { field, text, relation, readonly, date } from '@nozbe/watermelondb/decorators';

export default class MealEntry extends Model {
  static table = 'meal_entries';

  static associations = {
    diet_logs: { type: 'belongs_to' as const, key: 'diet_log_id' },
  };

  // @ts-ignore
  @field('server_id') serverId?: string;
  // @ts-ignore
  @text('client_uuid') clientUuid: string;
  // @ts-ignore
  @text('diet_log_id') dietLogId: string;
  // @ts-ignore
  @text('label') label: string;
  // @ts-ignore
  @field('protein_g') proteinG: number;
  // @ts-ignore
  @field('carbs_g') carbsG: number;
  // @ts-ignore
  @field('fat_g') fatG: number;
  // @ts-ignore
  @field('calories') calories: number;
  // @ts-ignore
  @field('condition_tag') conditionTag?: string;
  // @ts-ignore
  @field('meal_photo_id') mealPhotoId?: string;
  // @ts-ignore
  @date('logged_at') loggedAt: Date;
  // @ts-ignore
  @readonly @date('client_timestamp') clientTimestamp: Date;

  // @ts-ignore
  @relation('diet_logs', 'diet_log_id') dietLog: any;
}
