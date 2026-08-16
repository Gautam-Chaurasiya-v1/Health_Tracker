import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Button } from '../../components/common';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { DataExport } from './DataExport';

export const SettingsScreen: React.FC = () => {
  const [showBackupView, setShowBackupView] = useState(false);

  const displayName = usePreferencesStore((s) => s.displayName);
  const weightUnit = usePreferencesStore((s) => s.weightUnit);
  const proteinGoal = usePreferencesStore((s) => s.proteinGoalG);
  const carbsGoal = usePreferencesStore((s) => s.carbsGoalG);
  const fatsGoal = usePreferencesStore((s) => s.fatsGoalG);
  const caloriesGoal = usePreferencesStore((s) => s.caloriesGoal);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const [name, setName] = useState(displayName);
  const [unit, setUnit] = useState<'kg' | 'lbs'>(weightUnit);
  const [protein, setProtein] = useState(String(proteinGoal));
  const [carbs, setCarbs] = useState(String(carbsGoal));
  const [fats, setFats] = useState(String(fatsGoal));
  const [calories, setCalories] = useState(String(caloriesGoal));

  if (showBackupView) {
    return (
      <View style={{ flex: 1 }}>
        <Header
          title="Backup & Restore"
          leftAction={{ label: '← Back', onPress: () => setShowBackupView(false) }}
        />
        <DataExport />
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a display name.');
      return;
    }

    await updatePreferences({
      displayName: name.trim(),
      weightUnit: unit,
      proteinGoalG: parseInt(protein, 10) || proteinGoal,
      carbsGoalG: parseInt(carbs, 10) || carbsGoal,
      fatsGoalG: parseInt(fats, 10) || fatsGoal,
      caloriesGoal: parseInt(calories, 10) || caloriesGoal,
    });

    Alert.alert('Settings Saved', 'Your preferences and daily nutrition goals have been updated.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Profile & Preferences</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              testID="settings-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Weight Unit</Text>
            <View style={styles.unitRow}>
              <TouchableOpacity
                testID="unit-kg-btn"
                style={[styles.unitChip, unit === 'kg' && styles.unitChipActive]}
                onPress={() => setUnit('kg')}
              >
                <Text style={[styles.unitChipText, unit === 'kg' && styles.unitChipTextActive]}>
                  Kilograms (kg)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="unit-lbs-btn"
                style={[styles.unitChip, unit === 'lbs' && styles.unitChipActive]}
                onPress={() => setUnit('lbs')}
              >
                <Text style={[styles.unitChipText, unit === 'lbs' && styles.unitChipTextActive]}>
                  Pounds (lbs)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Nutrition Targets */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Daily Nutrition Targets</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Calories (kcal)</Text>
            <TextInput
              testID="settings-cal-input"
              style={styles.input}
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.protein }]}>Protein (g)</Text>
            <TextInput
              testID="settings-protein-input"
              style={styles.input}
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.carbs }]}>Carbohydrates (g)</Text>
            <TextInput
              testID="settings-carbs-input"
              style={styles.input}
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.fat }]}>Fats (g)</Text>
            <TextInput
              testID="settings-fats-input"
              style={styles.input}
              keyboardType="numeric"
              value={fats}
              onChangeText={setFats}
            />
          </View>

          <Button
            testID="save-settings-btn"
            title="Save Preferences"
            style={styles.saveBtn}
            onPress={handleSave}
          />
        </Card>

        {/* Data & Backup Link */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Data Management</Text>
          <Text style={styles.description}>
            Backup your database locally or export workouts to CSV for spreadsheet analysis.
          </Text>

          <Button
            testID="open-backup-btn"
            title="📦 Backup & Export Data"
            variant="ghost"
            style={styles.backupBtn}
            onPress={() => setShowBackupView(true)}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.fontSizes.md,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitChip: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
  },
  unitChipTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    marginTop: spacing.xs,
  },
  backupBtn: {
    marginTop: spacing.xs,
  },
});
