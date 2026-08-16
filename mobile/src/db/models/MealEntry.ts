import { Model } from '@nozbe/watermelondb';
import { field, text, relation, readonly, date } from '@nozbe/watermelondb/decorators';

export default class MealEntry extends Model {
  static table = 'meal_entries';

  static associations = {
    diet_logs: { type: 'belongs_to' as const, key: 'diet_log_id' },
  };

  @field('server_id') serverId?: string;
  @text('client_uuid') clientUuid!: string;
  @text('diet_log_id') dietLogId!: string;
  @text('label') label!: string;
  @field('protein_g') proteinG!: number;
  @field('carbs_g') carbsG!: number;
  @field('fat_g') fatG!: number;
  @field('calories') calories!: number;
  @field('condition_tag') conditionTag?: string;
  @field('meal_photo_id') mealPhotoId?: string;
  @date('logged_at') loggedAt!: Date;
  @readonly @date('client_timestamp') clientTimestamp!: Date;

  @relation('diet_logs', 'diet_log_id') dietLog!: any;
}
