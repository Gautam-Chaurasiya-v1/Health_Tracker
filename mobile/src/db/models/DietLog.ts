import { Model } from '@nozbe/watermelondb';
import { field, children, text } from '@nozbe/watermelondb/decorators';

export default class DietLog extends Model {
  static table = 'diet_logs';

  static associations = {
    meal_entries: { type: 'has_many' as const, foreignKey: 'diet_log_id' },
    media_records: { type: 'has_many' as const, foreignKey: 'diet_log_id' },
  };

  // @ts-ignore
  @field('server_id') serverId?: string;
  // @ts-ignore
  @text('date') date: string; // ISO date YYYY-MM-DD
  // @ts-ignore
  @field('body_weight') bodyWeight?: number;
  // @ts-ignore
  @field('weight_unit') weightUnit?: 'kg' | 'lbs';

  // @ts-ignore
  @children('meal_entries') mealEntries: any;
  // @ts-ignore
  @children('media_records') mediaRecords: any;
}
