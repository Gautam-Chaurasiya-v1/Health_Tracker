import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { formatDuration } from './WorkoutHistory';

export interface ExerciseEntryDetail {
  entryId: string;
  exerciseName: string;
  muscleGroup?: string;
  sets: Array<{
    setNumber: number;
    weight: number;
    reps: number;
    rir: number;
    notes?: string;
  }>;
  exerciseVolume: number;
}

export interface SessionDetailData {
  id: string;
  date: string;
  startedAt: number;
  finishedAt?: number;
  notes?: string;
  conditionTags: string[];
  entries: ExerciseEntryDetail[];
  grandTotalVolume: number;
}

interface SessionDetailProps {
  route?: { params?: { sessionId?: string } };
  sessionId?: string;
  navigation?: any;
  sessionOverride?: SessionDetailData; // For testing
}

export const SessionDetail: React.FC<SessionDetailProps> = ({
  route,
  sessionId: propSessionId,
  navigation,
  sessionOverride,
}) => {
  const sessionId = propSessionId || route?.params?.sessionId;
  const [detail, setDetail] = useState<SessionDetailData | null>(sessionOverride || null);
  const weightUnit = usePreferencesStore((s) => s.weightUnit) || 'kg';

  useEffect(() => {
    if (sessionOverride) {
      setDetail(sessionOverride);
      return;
    }

    if (!sessionId) return;

    async function loadSessionDetail() {
      try {
        const session = await database.collections
          .get<WorkoutSession>('workout_sessions')
          .find(sessionId!);

        const entries = await database.collections
          .get<ExerciseEntry>('exercise_entries')
          .query(Q.where('session_id', session.id), Q.sortBy('order_index', Q.asc))
          .fetch();

        const detailedEntries: ExerciseEntryDetail[] = [];
        let grandTotal = 0;

        for (const entry of entries) {
          let exerciseName = 'Custom Exercise';
          let muscleGroup: string | undefined;

          try {
            const ex = await database.collections.get<Exercise>('exercises').find(entry.exerciseId);
            if (ex) {
              exerciseName = ex.name;
              muscleGroup = ex.muscleGroup;
            }
          } catch (e) {
            // Exercise not found
          }

          const sets = await database.collections
            .get<Set>('sets')
            .query(Q.where('entry_id', entry.id), Q.sortBy('set_number', Q.asc))
            .fetch();

          let exVolume = 0;
          const mappedSets = sets.map((s) => {
            exVolume += s.weight * s.reps;
            return {
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
              rir: s.rir,
              notes: s.notes,
            };
          });

          grandTotal += exVolume;

          detailedEntries.push({
            entryId: entry.id,
            exerciseName,
            muscleGroup,
            sets: mappedSets,
            exerciseVolume: exVolume,
          });
        }

        let parsedTags: string[] = [];
        if (session.conditionTags) {
          try {
            parsedTags = JSON.parse(session.conditionTags);
          } catch (e) {
            parsedTags = [];
          }
        }

        setDetail({
          id: session.id,
          date: session.date,
          startedAt: session.startedAt,
          finishedAt: session.finishedAt,
          notes: session.notes || undefined,
          conditionTags: parsedTags,
          entries: detailedEntries,
          grandTotalVolume: grandTotal,
        });
      } catch (e) {
        console.error('Failed to load session detail:', e);
      }
    }

    loadSessionDetail();
  }, [sessionId, sessionOverride]);

  if (!detail) {
    return (
      <View style={styles.container}>
        <Header title="Session Details" leftAction={{ label: '← Back', onPress: () => navigation?.goBack?.() }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session details...</Text>
        </View>
      </View>
    );
  }

  let formattedDate = detail.date;
  try {
    formattedDate = format(parseISO(detail.date), 'MMMM d, yyyy');
  } catch (e) {
    // fallback
  }

  const durationText = formatDuration(detail.startedAt, detail.finishedAt);

  return (
    <View testID="session-detail-screen" style={styles.container}>
      <Header
        title="Session Details"
        leftAction={
          navigation?.goBack
            ? {
                label: '← Back',
                onPress: () => navigation.goBack(),
              }
            : undefined
        }
      />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Summary Banner */}
        <View style={styles.summaryCard}>
          <Text testID="detail-date" style={styles.dateTitle}>{formattedDate}</Text>
          <View style={styles.summaryRow}>
            <Text testID="detail-duration" style={styles.durationText}>⏱  Duration: {durationText}</Text>
            <Text testID="detail-grand-volume" style={styles.grandVolumeText}>
              Total Volume: {detail.grandTotalVolume} {weightUnit}
            </Text>
          </View>

          {/* Condition Tags */}
          {detail.conditionTags && detail.conditionTags.length > 0 && (
            <View testID="detail-tags-container" style={styles.tagsContainer}>
              {detail.conditionTags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Session Notes */}
        {detail.notes ? (
          <View testID="session-notes-section" style={styles.notesCard}>
            <Text style={styles.sectionHeading}>Session Notes</Text>
            <Text testID="detail-notes-text" style={styles.notesText}>{detail.notes}</Text>
          </View>
        ) : null}

        {/* Exercises & Sets Breakdown */}
        <Text style={styles.exercisesHeading}>Exercises & Sets</Text>

        {detail.entries.length === 0 ? (
          <Text style={styles.noEntriesText}>No exercises were recorded in this session.</Text>
        ) : (
          detail.entries.map((entry, idx) => (
            <View
              key={entry.entryId || idx}
              testID={`exercise-breakdown-${entry.entryId || idx}`}
              style={styles.exerciseCard}
            >
              <View style={styles.exerciseHeader}>
                <Text testID="detail-exercise-name" style={styles.exerciseName}>
                  {entry.exerciseName}
                </Text>
                <Text testID="detail-exercise-volume" style={styles.exerciseVolumeText}>
                  Volume: {entry.exerciseVolume} {weightUnit}
                </Text>
              </View>

              {entry.muscleGroup && (
                <Text style={styles.muscleGroupText}>{entry.muscleGroup}</Text>
              )}

              <View style={styles.setsList}>
                {entry.sets.map((s) => (
                  <View key={s.setNumber} testID={`detail-set-${s.setNumber}`} style={styles.setRow}>
                    <Text style={styles.setMainText}>
                      Set {s.setNumber}:  {s.weight}{weightUnit} × {s.reps}  @  {s.rir} RIR
                    </Text>
                    {s.notes ? <Text style={styles.setNotesText}>{s.notes}</Text> : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTitle: {
    color: colors.text,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  durationText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
  },
  grandVolumeText: {
    color: colors.success,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  tagsContainer: {
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
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    textTransform: 'capitalize',
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  notesText: {
    color: colors.text,
    fontSize: typography.fontSizes.sm,
  },
  exercisesHeading: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.sm,
  },
  noEntriesText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.sm,
    fontStyle: 'italic',
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  exerciseVolumeText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  muscleGroupText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
    textTransform: 'capitalize',
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  setsList: {
    marginTop: spacing.xs,
  },
  setRow: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: spacing.borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginVertical: 2,
  },
  setMainText: {
    color: colors.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  setNotesText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
});
