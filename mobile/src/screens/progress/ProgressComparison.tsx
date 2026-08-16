import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { database } from '../../db';
import MediaRecord from '../../db/models/MediaRecord';
import DietLog from '../../db/models/DietLog';
import { colors, spacing, typography } from '../../theme';
import { Header } from '../../components/common';
import { format } from 'date-fns';
import { getFullMediaUri } from '../../utils/mediaUri';

type RouteProps = RouteProp<RootStackParamList, 'ProgressComparison'>;

interface PhotoDetail {
  id: string;
  localUri: string;
  poseType?: string;
  dateStr: string;
  bodyWeight?: number | null;
  weightUnit?: string;
}

export const ProgressComparison: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { photoAId, photoBId } = route.params;

  const [photoA, setPhotoA] = useState<PhotoDetail | null>(null);
  const [photoB, setPhotoB] = useState<PhotoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComparisonPhotos() {
      try {
        const mediaCollection = database.get<MediaRecord>('media_records');
        const dietLogsCollection = database.get<DietLog>('diet_logs');

        const [recA, recB] = await Promise.all([
          mediaCollection.find(photoAId),
          mediaCollection.find(photoBId),
        ]);

        let weightA: number | null = null;
        let unitA = 'kg';
        if (recA.dietLogId) {
          try {
            const logA = await dietLogsCollection.find(recA.dietLogId);
            weightA = logA.bodyWeight ?? null;
            unitA = logA.weightUnit || 'kg';
          } catch {}
        }

        let weightB: number | null = null;
        let unitB = 'kg';
        if (recB.dietLogId) {
          try {
            const logB = await dietLogsCollection.find(recB.dietLogId);
            weightB = logB.bodyWeight ?? null;
            unitB = logB.weightUnit || 'kg';
          } catch {}
        }

        setPhotoA({
          id: recA.id,
          localUri: getFullMediaUri(recA.localUri) || '',
          poseType: recA.poseType,
          dateStr: recA.createdAt ? format(new Date(recA.createdAt), 'MMM d, yyyy') : '',
          bodyWeight: weightA,
          weightUnit: unitA,
        });

        setPhotoB({
          id: recB.id,
          localUri: getFullMediaUri(recB.localUri) || '',
          poseType: recB.poseType,
          dateStr: recB.createdAt ? format(new Date(recB.createdAt), 'MMM d, yyyy') : '',
          bodyWeight: weightB,
          weightUnit: unitB,
        });
      } catch (err) {
        console.error('Failed to load comparison photos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadComparisonPhotos();
  }, [photoAId, photoBId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Side-by-Side Comparison"
        leftAction={{ label: 'Close', onPress: () => navigation.goBack() }}
      />

      <View style={styles.comparisonContainer}>
        {/* Left Photo (Before / Photo A) */}
        <View style={styles.halfPane}>
          <View style={styles.paneHeader}>
            <Text style={styles.paneTitle}>{photoA?.dateStr || 'Photo 1'}</Text>
            {photoA?.bodyWeight ? (
              <Text style={styles.paneWeight}>
                {photoA.bodyWeight} {photoA.weightUnit}
              </Text>
            ) : null}
            {photoA?.poseType && (
              <View style={styles.poseChip}>
                <Text style={styles.poseChipText}>{photoA.poseType}</Text>
              </View>
            )}
          </View>

          <View style={styles.imageWrapper}>
            {photoA?.localUri ? (
              <Image
                testID="photo-a-img"
                source={{ uri: photoA.localUri }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.placeholderEmoji}>📸</Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Right Photo (After / Photo B) */}
        <View style={styles.halfPane}>
          <View style={styles.paneHeader}>
            <Text style={styles.paneTitle}>{photoB?.dateStr || 'Photo 2'}</Text>
            {photoB?.bodyWeight ? (
              <Text style={styles.paneWeight}>
                {photoB.bodyWeight} {photoB.weightUnit}
              </Text>
            ) : null}
            {photoB?.poseType && (
              <View style={styles.poseChip}>
                <Text style={styles.poseChipText}>{photoB.poseType}</Text>
              </View>
            )}
          </View>

          <View style={styles.imageWrapper}>
            {photoB?.localUri ? (
              <Image
                testID="photo-b-img"
                source={{ uri: photoB.localUri }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.placeholderEmoji}>📸</Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  halfPane: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  paneHeader: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
  },
  paneTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  paneWeight: {
    fontSize: typography.fontSizes.xs,
    color: colors.primaryLight,
    fontWeight: typography.fontWeights.semibold,
    marginTop: 2,
  },
  poseChip: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: spacing.borderRadius.xs,
    marginTop: 4,
  },
  poseChipText: {
    fontSize: 9,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.bold,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  divider: {
    width: 2,
    backgroundColor: colors.border,
  },
});
