import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

interface NameStepProps {
  name: string;
  onChangeName: (name: string) => void;
}

export const NameStep: React.FC<NameStepProps> = ({ name, onChangeName }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What's your name?</Text>
      <Text style={styles.subheading}>
        We use your name to personalize your fitness and diet dashboard.
      </Text>

      <TextInput
        testID="name-input"
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={onChangeName}
        autoCapitalize="words"
        autoFocus
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  heading: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: typography.fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    height: 52,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.fontSizes.lg,
  },
});
