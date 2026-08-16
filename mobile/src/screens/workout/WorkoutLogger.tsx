import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { colors, spacing, typography } from '../../theme';
import { Header, Button } from '../../components/common';
import { GhostBanner } from '../../components/workout/GhostBanner';
import { SetInputForm } from '../../components/workout/SetInputForm';
import { SetRow, SetRowData } from '../../components/workout/SetRow';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { database } from '../../db';
import Exercise from '../../db/models/Exercise';
import Set from '../../db/models/Set';
import { Q } from '@nozbe/watermelondb';
import { WorkoutCondition } from '../../../../shared/types/enums';

interface WorkoutLoggerProps {
  navigation?: any;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ navigation }) => {
  const activeSessionId = useWorkoutStore((s) => s.activeSessionId);
  const activeExerciseEntryId = useWorkoutStore((s) => s.activeExerciseEntryId);
  const activeExerciseId = useWorkoutStore((s) => s.activeExerciseId);
  const selectedDate = useWorkoutStore((s) => s.selectedDate);
  const setSelectedDate = useWorkoutStore((s) => s.setSelectedDate);
  const startSession = useWorkoutStore((s) => s.startSession);
  const finishSession = useWorkoutStore((s) => s.finishSession);
  const logSet = useWorkoutStore((s) => s.logSet);
  const updateNotes = useWorkoutStore((s) => s.updateNotes);
  const setConditionTags = useWorkoutStore((s) => s.setConditionTags);

  const weightUnit = usePreferencesStore((s) => s.weightUnit) || 'kg';

  const [exerciseName, setExerciseName] = useState<string>('Select Exercise');
  const [loggedSets, setLoggedSets] = useState<SetRowData[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<WorkoutCondition[]>([]);

  // Load session on mount for the selected date
  useEffect(() => {
    async function init() {
      await useWorkoutStore.getState().loadSessionForDate(selectedDate);
    }
    init();
  }, [selectedDate]);

  // Load exercise details
  useEffect(() => {
    async function loadExercise() {
      if (activeExerciseId) {
        try {
          const ex = await database.collections.get<Exercise>('exercises').find(activeExerciseId);
          setExerciseName(ex.name);
        } catch (e) {
          setExerciseName('Custom Exercise');
        }
      } else {
        setExerciseName('Select Exercise');
      }
    }
    loadExercise();
  }, [activeExerciseId]);

  const deleteSet = useWorkoutStore((s) => s.deleteSet);

  // Subscribe/load sets for active exercise entry
  useEffect(() => {
    if (!activeExerciseEntryId) {
      setLoggedSets([]);
      return;
    }

    const setsCollection = database.get<Set>('sets');
    const query = setsCollection.query(Q.where('entry_id', activeExerciseEntryId));

    const subscription = query.observe().subscribe((sets) => {
      const sorted = sets
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((s) => ({
          id: s.id,
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
          rir: s.rir,
          notes: s.notes,
        }));
      setLoggedSets(sorted);
    });

    return () => subscription.unsubscribe();
  }, [activeExerciseEntryId]);

  const lastSet = loggedSets.length > 0 ? loggedSets[loggedSets.length - 1] : null;

  const handlePrevDay = async () => {
    const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    await setSelectedDate(prev);
  };

  const handleNextDay = async () => {
    const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    await setSelectedDate(next);
  };

  const handleStartWorkoutForDate = async () => {
    await startSession(selectedDate);
  };

  const handleLogSet = async (data: { weight: number; reps: number; rir: number }) => {
    if (!activeExerciseEntryId || !activeExerciseId) {
      Alert.alert('Please Select an Exercise', 'Add or select an exercise first before logging sets.');
      return;
    }

    try {
      await logSet(activeExerciseEntryId, activeExerciseId, data);
    } catch (err: any) {
      Alert.alert('Validation Error', err.message || 'Failed to log set');
    }
  };

  const handleDeleteSet = (setId?: string, setNum?: number) => {
    if (!setId || !activeExerciseEntryId || !activeExerciseId) return;

    Alert.alert('Delete Set', `Delete Set #${setNum} from this exercise?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSet(setId, activeExerciseEntryId, activeExerciseId);
        },
      },
    ]);
  };

  const handleToggleTag = async (tag: WorkoutCondition) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag].slice(0, 10);

    setSelectedTags(nextTags);
    if (activeSessionId) {
      await setConditionTags(activeSessionId, nextTags);
    }
  };

  const handleFinish = async () => {
    if (!activeSessionId) return;

    if (sessionNotes) {
      await updateNotes(activeSessionId, sessionNotes);
    }

    await finishSession(activeSessionId);
    Alert.alert('Workout Finished!', 'Your session has been recorded.');
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const formattedDateTitle = isToday
    ? `Today, ${format(parseISO(selectedDate), 'MMM d')}`
    : format(parseISO(selectedDate), 'EEE, MMM d, yyyy');

  const availableConditions = [
    { tag: WorkoutCondition.NORMAL, label: 'Normal' },
    { tag: WorkoutCondition.HIGH_ENERGY, label: 'High Energy' },
    { tag: WorkoutCondition.FATIGUED, label: 'Fatigued' },
    { tag: WorkoutCondition.JOINT_PAIN, label: 'Joint Pain' },
    { tag: WorkoutCondition.POOR_SLEEP, label: 'Poor Sleep' },
  ];

  return (
    <View testID="workout-logger-screen" style={styles.container}>
      <Header
        title="Workout"
        rightAction={{
          label: 'History',
          onPress: () => {
            if (navigation && navigation.navigate) {
              navigation.navigate('WorkoutHistory');
            }
          },
        }}
      />

      {/* Date Header */}
      <View style={styles.dateHeader}>
        <TouchableOpacity
          testID="prev-date-btn"
          onPress={handlePrevDay}
          style={styles.dateNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dateNavArrow}>◀</Text>
        </TouchableOpacity>

        <Text testID="date-display" style={styles.dateTitle}>
          {formattedDateTitle}
        </Text>

        <TouchableOpacity
          testID="next-date-btn"
          onPress={handleNextDay}
          style={styles.dateNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dateNavArrow}>▶</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!activeSessionId ? (
          <View testID="no-workout-empty-state" style={styles.emptySessionCard}>
            <Text style={styles.emptySessionIcon}>🏋️</Text>
            <Text style={styles.emptySessionTitle}>No Workout Logged</Text>
            <Text style={styles.emptySessionSubtitle}>
              {isToday
                ? 'Ready to train today? Start logging your exercises and sets!'
                : `No training session was recorded on ${formattedDateTitle}.`}
            </Text>
            <Button
              testID="start-workout-for-date-btn"
              title="Start Workout"
              onPress={handleStartWorkoutForDate}
              style={styles.startWorkoutBtn}
            />
          </View>
        ) : (
          <>
            {/* Exercise Header & Picker Button */}
            <View style={styles.exerciseHeaderCard}>
              <View>
                <Text style={styles.exerciseLabel}>Current Exercise</Text>
                <Text testID="current-exercise-title" style={styles.exerciseTitle}>
                  {exerciseName}
                </Text>
              </View>
              <TouchableOpacity
                testID="select-exercise-btn"
                style={styles.changeExerciseBtn}
                onPress={() => {
                  if (navigation && navigation.navigate) {
                    navigation.navigate('ExerciseLibrary');
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.changeExerciseBtnText}>
                  {activeExerciseEntryId ? 'Switch / Add' : '+ Select'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Real Ghost Banner Component */}
            <GhostBanner exerciseId={activeExerciseId} weightUnit={weightUnit as 'kg' | 'lbs'} />

            {/* Logged Sets List */}
            <View style={styles.setsSection}>
              <Text style={styles.sectionHeader}>Logged Sets ({loggedSets.length})</Text>
              {loggedSets.length === 0 ? (
                <Text style={styles.emptySetsText}>No sets logged yet for this exercise.</Text>
              ) : (
                loggedSets.map((s) => (
                  <SetRow
                    key={s.id || s.setNumber}
                    set={s}
                    weightUnit={weightUnit as 'kg' | 'lbs'}
                    onDelete={() => handleDeleteSet(s.id, s.setNumber)}
                  />
                ))
              )}
            </View>

            {/* 3-Tap Set Input Form */}
            <SetInputForm
              previousSet={lastSet}
              weightUnit={weightUnit as 'kg' | 'lbs'}
              onConfirm={handleLogSet}
            />

            {/* Condition Tags Selector */}
            <View style={styles.conditionSection}>
              <Text style={styles.sectionHeader}>Session Condition Tags (Max 10)</Text>
              <View style={styles.chipsRow}>
                {availableConditions.map(({ tag, label }) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      testID={`condition-chip-${tag}`}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => handleToggleTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Session Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionHeader}>Session Notes</Text>
              <TextInput
                testID="session-notes-input"
                style={styles.notesInput}
                placeholder="How did the session feel? Any pain or PRs?"
                placeholderTextColor={colors.textMuted}
                value={sessionNotes}
                onChangeText={setSessionNotes}
                multiline
              />
            </View>

            {/* Finish Session Button */}
            <TouchableOpacity
              testID="finish-workout-btn"
              style={styles.finishButton}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.finishButtonText}>✓ Finish & Save Workout</Text>
            </TouchableOpacity>
          </>
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
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateNavButton: {
    padding: spacing.xs,
  },
  dateNavArrow: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: typography.fontWeights.bold,
  },
  dateTitle: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  emptySessionCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptySessionIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptySessionTitle: {
    color: colors.text,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  emptySessionSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  startWorkoutBtn: {
    width: '100%',
  },
  scrollContent: {
    flex: 1,
    padding: spacing.md,
  },
  exerciseHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  exerciseLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseTitle: {
    color: colors.text,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  changeExerciseBtn: {
    backgroundColor: colors.surfaceHighlight,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeExerciseBtnText: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  setsSection: {
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  emptySetsText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.sm,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  conditionSection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  notesSection: {
    marginVertical: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  finishButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
});
