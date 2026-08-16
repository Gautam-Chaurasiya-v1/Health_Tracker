import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header } from '../../components/common';

export const WorkoutStubScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header title="Workout" />
      <View style={styles.content}>
        <Text style={styles.title}>Workout Engine</Text>
        <Text style={styles.subtitle}>Dev A Domain — Workout Logger & History</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
