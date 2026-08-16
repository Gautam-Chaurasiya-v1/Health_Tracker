import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { Q } from '@nozbe/watermelondb';
import { colors, spacing, typography } from '../../theme';
import { Header } from '../../components/common';
import { database } from '../../db';
import WorkoutSession from '../../db/models/WorkoutSession';
import ExerciseEntry from '../../db/models/ExerciseEntry';
import Exercise from '../../db/models/Exercise';
import Set from '../../db/models/Set';
import { usePreferencesStore } from '../../stores/usePreferencesStore';

interface WorkoutHistoryProps {
  navigation?: any;
  sessionsOverride?: SessionSummaryItem[]; // For testing
}

export interface SessionSummaryItem {
  id: string;
  date: string;
  startedAt: number;
  finishedAt?: number;
  durationText: string;
  exerciseNames: string;
  totalVolume: number;
  conditionTags: string[];
}

export function formatDuration(startedAt: number, finishedAt?: number): string {
  if (!finishedAt || finishedAt <= startedAt) {
    return 'In Progress';
  }
  const diffMinutes = Math.round((finishedAt - startedAt) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatSessionDate(dateStr: string): string {
  try {
    const parsed = parseISO(dateStr);
    return format(parsed, 'MMM d, yyyy');
  } catch (e) {
    return dateStr;
  }
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  navigation,
  sessionsOverride,
}) => {
  const [sessions, setSessions] = useState<SessionSummaryItem[]>(sessionsOverride || []);
  const weightUnit = usePreferencesStore((s) => s.weightUnit) || 'kg';

  useEffect(() => {
    if (sessionsOverride) {
      setSessions(sessionsOverride);
      return;
    }

    const sessionsCollection = database.collections.get<WorkoutSession>('workout_sessions');
    const query = sessionsCollection.query(Q.sortBy('started_at', Q.desc));

    const subscription = query.observe().subscribe(async (records) => {
      const summaries: SessionSummaryItem[] = [];

      for (const s of records) {
        // Fetch entries
        const entries = await database.collections
          .get<ExerciseEntry>('exercise_entries')
          .query(Q.where('session_id', s.id))
          .fetch();

        const exerciseNameList: string[] = [];
        let sessionVolume = 0;

        for (const entry of entries) {
          try {
            const ex = await database.collections.get<Exercise>('exercises').find(entry.exerciseId);
            if (ex && !exerciseNameList.includes(ex.name)) {
              exerciseNameList.push(ex.name);
            }
          } catch (e) {
            // Exercise might be custom or removed
          }

          const sets = await database.collections
            .get<Set>('sets')
            .query(Q.where('entry_id', entry.id))
            .fetch();

          for (const setRecord of sets) {
            sessionVolume += setRecord.weight * setRecord.reps;
          }
        }

        let parsedTags: string[] = [];
        if (s.conditionTags) {
          try {
            parsedTags = JSON.parse(s.conditionTags);
          } catch (e) {
            parsedTags = [];
          }
        }

        summaries.push({
          id: s.id,
          date: s.date,
          startedAt: s.startedAt,
          finishedAt: s.finishedAt,
          durationText: formatDuration(s.startedAt, s.finishedAt),
          exerciseNames: exerciseNameList.length > 0 ? exerciseNameList.join(', ') : 'No exercises logged',
          totalVolume: sessionVolume,
          conditionTags: parsedTags,
        });
      }

      setSessions(summaries);
    });

    return () => subscription.unsubscribe();
  }, [sessionsOverride]);

  const handlePressSession = (sessionId: string) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('SessionDetail', { sessionId });
    }
  };

  return (
    <View testID="workout-history-screen" style={styles.container}>
      <Header title="Workout History" />

      <FlatList
        testID="workout-history-list"
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View testID="history-empty-state" style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>Start your first session and make progress!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`history-session-card-${item.id}`}
            style={styles.card}
            onPress={() => handlePressSession(item.id)}
            activeOpacity={0.7}
          >
            {/* Header: Date + Duration Badge */}
            <View style={styles.cardHeader}>
              <Text testID="session-date-text" style={styles.dateText}>
                {formatSessionDate(item.date)}
              </Text>
              <View
                style={[
                  styles.durationBadge,
                  item.durationText === 'In Progress' && styles.durationBadgeInProgress,
                ]}
              >
                <Text
                  testID="session-duration-text"
                  style={[
                    styles.durationText,
                    item.durationText === 'In Progress' && styles.durationTextInProgress,
                  ]}
                >
                  {item.durationText}
                </Text>
              </View>
            </View>

            {/* Exercises List */}
            <Text testID="session-exercises-text" style={styles.exercisesText} numberOfLines={2}>
              {item.exerciseNames}
            </Text>

            {/* Total Volume */}
            <View style={styles.volumeRow}>
              <Text style={styles.volumeLabel}>Total Volume:</Text>
              <Text testID="session-volume-text" style={styles.volumeValue}>
                {item.totalVolume} {weightUnit}
              </Text>
            </View>

            {/* Condition Tags */}
            {item.conditionTags && item.conditionTags.length > 0 && (
              <View testID="session-tags-container" style={styles.tagsRow}>
                {item.conditionTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dateText: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  durationBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  durationBadgeInProgress: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: colors.warning,
  },
  durationText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  durationTextInProgress: {
    color: colors.warning,
  },
  exercisesText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    marginVertical: spacing.xs,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  volumeLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
    marginRight: spacing.xs,
  },
  volumeValue: {
    color: colors.success,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagChip: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.sm,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
  },
});
