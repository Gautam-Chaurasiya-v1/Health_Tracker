import { Model } from '@nozbe/watermelondb';
import { field, children, text } from '@nozbe/watermelondb/decorators';

export default class DietLog extends Model {
  static table = 'diet_logs';

  static associations = {
    meal_entries: { type: 'has_many' as const, foreignKey: 'diet_log_id' },
    media_records: { type: 'has_many' as const, foreignKey: 'diet_log_id' },
  };

  @field('server_id') serverId?: string;
  @text('date') date!: string; // ISO date YYYY-MM-DD
  @field('body_weight') bodyWeight?: number;
  @field('weight_unit') weightUnit?: 'kg' | 'lbs';

  @children('meal_entries') mealEntries!: any;
  @children('media_records') mediaRecords!: any;
}
