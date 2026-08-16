import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header } from '../../components/common';
import { ExerciseCard, ExerciseCardData } from '../../components/workout/ExerciseCard';
import { database } from '../../db';
import Exercise from '../../db/models/Exercise';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { seedExercisesIfEmpty } from '../../db/seedService';

interface ExerciseLibraryProps {
  navigation?: any;
}

const MUSCLE_GROUPS = [
  'all',
  'quads',
  'hamstrings',
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'calves',
  'glutes',
  'rear_delt',
];

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ navigation }) => {
  const [exercises, setExercises] = useState<ExerciseCardData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');

  // Custom exercise modal state
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState<string>('chest');
  const [customEquipment, setCustomEquipment] = useState<string>('');

  const activeSessionId = useWorkoutStore((s) => s.activeSessionId);
  const startSession = useWorkoutStore((s) => s.startSession);
  const addExerciseEntry = useWorkoutStore((s) => s.addExerciseEntry);

  useEffect(() => {
    async function initAndSubscribe() {
      await seedExercisesIfEmpty(database);
      const collection = database.collections.get<Exercise>('exercises');
      const subscription = collection.query().observe().subscribe((records) => {
        const mapped = records.map((r) => ({
          id: r.id,
          name: r.name,
          muscleGroup: r.muscleGroup,
          equipment: r.equipment,
          isCustom: r.isCustom,
        }));
        setExercises(mapped);
      });
      return () => subscription.unsubscribe();
    }
    initAndSubscribe();
  }, []);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesGroup =
        selectedMuscleGroup === 'all' ||
        ex.muscleGroup.toLowerCase() === selectedMuscleGroup.toLowerCase();
      return matchesSearch && matchesGroup;
    });
  }, [exercises, searchQuery, selectedMuscleGroup]);

  const handleSelectExercise = async (exercise: ExerciseCardData) => {
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await startSession();
    }

    await addExerciseEntry(sessionId, exercise.id);

    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleSaveCustomExercise = async () => {
    if (!customName.trim()) {
      Alert.alert('Validation Error', 'Exercise name is required');
      return;
    }

    await database.write(async () => {
      const collection = database.collections.get<Exercise>('exercises');
      await collection.create((record: Exercise) => {
        record.name = customName.trim();
        record.muscleGroup = customMuscleGroup;
        record.equipment = customEquipment.trim() || undefined;
        record.isCustom = true;
      });
    });

    setCustomName('');
    setCustomEquipment('');
    setIsModalVisible(false);
  };

  return (
    <View testID="exercise-library-screen" style={styles.container}>
      <Header
        title="Exercise Library"
        leftAction={
          navigation?.goBack
            ? {
                label: '← Back',
                onPress: () => navigation.goBack(),
              }
            : undefined
        }
      />

      <View style={styles.searchContainer}>
        <TextInput
          testID="exercise-search-input"
          style={styles.searchInput}
          placeholder="🔍  Search exercises by name..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Muscle Group Filter Chips */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {MUSCLE_GROUPS.map((group) => {
            const isSelected = selectedMuscleGroup === group;
            return (
              <TouchableOpacity
                key={group}
                testID={`muscle-group-chip-${group}`}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedMuscleGroup(group)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {group.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Exercises List */}
      <FlatList
        testID="exercise-list"
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No exercises found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExerciseCard exercise={item} onPress={() => handleSelectExercise(item)} />
        )}
      />

      {/* Floating Action Button for Custom Exercise */}
      <TouchableOpacity
        testID="add-custom-exercise-fab"
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Custom Exercise Modal */}
      <Modal
        testID="custom-exercise-modal"
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Custom Exercise</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Exercise Name *</Text>
              <TextInput
                testID="custom-exercise-name-input"
                style={styles.modalInput}
                placeholder="e.g. Incline Cable Fly"
                placeholderTextColor={colors.textMuted}
                value={customName}
                onChangeText={setCustomName}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Target Muscle Group *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalChipsScroll}>
                {MUSCLE_GROUPS.filter((g) => g !== 'all').map((g) => {
                  const isSel = customMuscleGroup === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      testID={`modal-muscle-chip-${g}`}
                      style={[styles.modalChip, isSel && styles.modalChipSelected]}
                      onPress={() => setCustomMuscleGroup(g)}
                    >
                      <Text style={[styles.modalChipText, isSel && styles.modalChipTextSelected]}>
                        {g.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Equipment (Optional)</Text>
              <TextInput
                testID="custom-exercise-equipment-input"
                style={styles.modalInput}
                placeholder="e.g. Cable, Barbell, Dumbbell"
                placeholderTextColor={colors.textMuted}
                value={customEquipment}
                onChangeText={setCustomEquipment}
              />
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                testID="cancel-custom-exercise-btn"
                style={styles.modalCancelBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="save-custom-exercise-btn"
                style={styles.modalSaveBtn}
                onPress={handleSaveCustomExercise}
              >
                <Text style={styles.modalSaveBtnText}>Save Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipsContainer: {
    paddingVertical: spacing.sm,
  },
  chipsScroll: {
    paddingHorizontal: spacing.md,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#000000',
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.md,
  },
  modalInputGroup: {
    marginBottom: spacing.md,
  },
  modalLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalChipsScroll: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  modalChip: {
    backgroundColor: colors.background,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  modalChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalChipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textTransform: 'capitalize',
  },
  modalChipTextSelected: {
    color: '#000000',
    fontWeight: typography.fontWeights.bold,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.surfaceHighlight,
  },
  modalCancelBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
  },
  modalSaveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.primary,
  },
  modalSaveBtnText: {
    color: '#000000',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
});
