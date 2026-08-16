import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Button } from '../../components/common';
import {
  exportFullBackupJSON,
  exportWorkoutCSV,
  estimateBackupSize,
} from '../../utils/exportService';
import { validateBackupJSON, restoreBackup } from '../../utils/importService';
import { readTextFile } from '../../utils/fileReader';

export const DataExport: React.FC = () => {
  const [estimatedSize, setEstimatedSize] = useState<string>('Calculating...');
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    async function loadSize() {
      const size = await estimateBackupSize();
      setEstimatedSize(size);
    }
    loadSize();
  }, []);

  const handleExportJSON = async () => {
    setIsExportingJSON(true);
    try {
      await exportFullBackupJSON();
      Alert.alert('Backup Created', 'Your backup JSON was generated and ready to share or save.');
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export database backup.');
    } finally {
      setIsExportingJSON(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      await exportWorkoutCSV();
      Alert.alert('CSV Exported', 'Workout history CSV ready for analysis in Excel or Sheets.');
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export workout CSV.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleImportJSON = async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (doc.canceled || !doc.assets || doc.assets.length === 0) {
        return;
      }

      const fileUri = doc.assets[0].uri;
      const fileContent = await readTextFile(fileUri, doc.assets[0].file);

      const validation = validateBackupJSON(fileContent);
      if (!validation.valid) {
        Alert.alert('Invalid Backup', validation.errorMessage || 'File structure is invalid.');
        return;
      }

      const totalRecords = Object.values(validation.recordCounts).reduce((a, b) => a + b, 0);

      Alert.alert(
        'Confirm Restore',
        `This backup contains ${totalRecords} records across ${Object.keys(validation.recordCounts).length} tables. Existing data will not be overwritten (merge-based restore).`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore Now',
            onPress: async () => {
              setIsRestoring(true);
              try {
                const result = await restoreBackup(fileContent);
                Alert.alert(
                  'Restore Complete',
                  `Successfully added ${result.insertedCount} new records (${result.skippedCount} duplicates skipped).`
                );
              } catch (err: any) {
                Alert.alert('Restore Failed', err.message || 'Could not restore backup.');
              } finally {
                setIsRestoring(false);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Import Error', err.message || 'Could not read backup file.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Data Backup & Export" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1: Full JSON Backup */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Full Database Backup</Text>
          <Text style={styles.description}>
            Export your entire training history, diet logs, and preferences into a single JSON file. You can restore this backup anytime or on another device.
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Estimated Backup Size:</Text>
            <Text style={styles.metaValue}>{estimatedSize}</Text>
          </View>

          <Text style={styles.note}>
            Note: Progress photos are referenced by path and should be backed up with your device photo gallery.
          </Text>

          <Button
            testID="export-json-btn"
            title="Export Complete JSON Backup"
            variant="primary"
            loading={isExportingJSON}
            style={styles.actionBtn}
            onPress={handleExportJSON}
          />
        </Card>

        {/* Section 2: CSV Workout Export */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Workout History (CSV)</Text>
          <Text style={styles.description}>
            Export all completed workout sets into a spreadsheet-friendly CSV format (Date, Exercise, Sets, Weight, Reps, RIR, Notes).
          </Text>

          <Button
            testID="export-csv-btn"
            title="Export Workouts to CSV"
            variant="ghost"
            loading={isExportingCSV}
            style={styles.actionBtn}
            onPress={handleExportCSV}
          />
        </Card>

        {/* Section 3: Restore Backup */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Restore from Backup</Text>
          <Text style={styles.description}>
            Restore your workouts and diet logs from a previously exported GymTracker JSON file. New records are merged with your current data.
          </Text>

          <Button
            testID="import-json-btn"
            title="Choose Backup File (.json)"
            variant="secondary"
            loading={isRestoring}
            style={styles.actionBtn}
            onPress={handleImportJSON}
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
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  metaValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryLight,
  },
  note: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
});
