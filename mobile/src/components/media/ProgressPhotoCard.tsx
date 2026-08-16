import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MediaRecordEntity } from '../../../../shared/types/entities';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../common';
import { format } from 'date-fns';
import { getFullMediaUri } from '../../utils/mediaUri';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 3) / 2;

interface ProgressPhotoCardProps {
  media: MediaRecordEntity;
  bodyWeight?: number | null;
  weightUnit?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onPress: () => void;
  testID?: string;
}

export const ProgressPhotoCard: React.FC<ProgressPhotoCardProps> = ({
  media,
  bodyWeight,
  weightUnit = 'kg',
  isSelectionMode = false,
  isSelected = false,
  onPress,
  testID,
}) => {
  const fullLocalUri = getFullMediaUri(media.local_uri);

  const formattedDate = media.created_at
    ? format(new Date(media.created_at), 'MMM d, yyyy')
    : 'Unknown Date';

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.cardContainer,
        isSelected && styles.cardSelected,
      ]}
    >
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          {fullLocalUri ? (
            <Image
              testID={`${testID ?? 'photo-card'}-img`}
              source={{ uri: fullLocalUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📸</Text>
            </View>
          )}

          {media.pose_type && (
            <View style={styles.poseBadge}>
              <Text style={styles.poseBadgeText}>{media.pose_type}</Text>
            </View>
          )}

          {isSelectionMode && (
            <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          {bodyWeight ? (
            <Text style={styles.weightText}>
              {bodyWeight} {weightUnit}
            </Text>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
  },
  cardSelected: {
    borderRadius: spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  card: {
    padding: spacing.xs,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
    borderRadius: spacing.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHighlight,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  poseBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.xs,
  },
  poseBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.bold,
  },
  selectCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  dateText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  weightText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryLight,
  },
});
