import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Button } from '../../components/common';
import { ProgressPhotoCard } from '../../components/media/ProgressPhotoCard';
import { MediaPicker } from '../../components/media/MediaPicker';
import { useMediaStore } from '../../stores/useMediaStore';
import { useDietStore } from '../../stores/useDietStore';
import { MediaContext, PoseType } from '../../../../shared/types/enums';
import { MediaRecordEntity } from '../../../../shared/types/entities';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const POSE_FILTERS: Array<{ key: PoseType | 'all'; label: string }> = [
  { key: 'all', label: 'All Poses' },
  { key: PoseType.Front, label: 'Front' },
  { key: PoseType.Side, label: 'Side' },
  { key: PoseType.Back, label: 'Back' },
];

export const ProgressTimeline: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mediaList = useMediaStore((s) => s.mediaList);
  const loadMediaByContext = useMediaStore((s) => s.loadMediaByContext);
  const poseFilter = useMediaStore((s) => s.selectedPoseFilter);
  const setPoseFilter = useMediaStore((s) => s.setPoseFilter);
  const deleteMedia = useMediaStore((s) => s.deleteMedia);

  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [filterByDate, setFilterByDate] = useState<boolean>(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  useEffect(() => {
    loadMediaByContext(MediaContext.DietProgress);
  }, [loadMediaByContext]);

  const filteredPhotos = useMemo(() => {
    let list = mediaList;
    if (poseFilter !== 'all') {
      list = list.filter((m) => m.pose_type === poseFilter);
    }
    if (filterByDate) {
      list = list.filter((m) => {
        const photoDate = format(new Date(m.created_at), 'yyyy-MM-dd');
        return photoDate === selectedDate;
      });
    }
    return list;
  }, [mediaList, poseFilter, filterByDate, selectedDate]);

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(prev);
    setFilterByDate(true);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(next);
    setFilterByDate(true);
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const formattedDateTitle = !filterByDate
    ? 'All Photos (Timeline)'
    : isToday
    ? `Today, ${format(parseISO(selectedDate), 'MMM d')}`
    : format(parseISO(selectedDate), 'EEE, MMM d, yyyy');

  const handleDeletePhoto = (photo: MediaRecordEntity) => {
    Alert.alert('Delete Progress Photo', 'Are you sure you want to permanently delete this progress photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedia(photo.id);
        },
      },
    ]);
  };

  const handleCardPress = (media: MediaRecordEntity) => {
    if (isSelectionMode) {
      if (selectedPhotoIds.includes(media.id)) {
        setSelectedPhotoIds((prev) => prev.filter((id) => id !== media.id));
      } else {
        if (selectedPhotoIds.length >= 2) {
          Alert.alert('Max 2 Photos', 'You can select up to 2 photos to compare.');
          return;
        }
        setSelectedPhotoIds((prev) => [...prev, media.id]);
      }
    }
  };

  const handleCompareLaunch = () => {
    if (selectedPhotoIds.length !== 2) {
      Alert.alert('Select 2 Photos', 'Please select exactly 2 photos to compare.');
      return;
    }

    navigation.navigate('ProgressComparison', {
      photoAId: selectedPhotoIds[0],
      photoBId: selectedPhotoIds[1],
    });
    setIsSelectionMode(false);
    setSelectedPhotoIds([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Body Progress"
        rightAction={
          filteredPhotos.length >= 2
            ? {
                label: isSelectionMode ? 'Cancel' : 'Compare',
                onPress: () => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedPhotoIds([]);
                },
              }
            : undefined
        }
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

        <TouchableOpacity
          onPress={() => setFilterByDate(!filterByDate)}
          activeOpacity={0.7}
        >
          <Text testID="date-display" style={styles.dateTitle}>
            {formattedDateTitle}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="next-date-btn"
          onPress={handleNextDay}
          style={styles.dateNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dateNavArrow}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={POSE_FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = poseFilter === item.key;
            return (
              <TouchableOpacity
                testID={`pose-filter-${item.key}`}
                onPress={() => setPoseFilter(item.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Selection Mode Bar */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionCount}>
            {selectedPhotoIds.length}/2 Selected
          </Text>
          <Button
            testID="confirm-compare-btn"
            title="Compare Now"
            disabled={selectedPhotoIds.length !== 2}
            style={styles.compareBtn}
            textStyle={styles.compareBtnText}
            onPress={handleCompareLaunch}
          />
        </View>
      )}

      {/* Capture Action & Photos Grid */}
      <View style={styles.content}>
        <View style={styles.pickerRow}>
          <MediaPicker
            context={MediaContext.DietProgress}
            buttonTitle="📸 Take Progress Photo"
            onMediaCaptured={() => loadMediaByContext(MediaContext.DietProgress)}
          />
        </View>

        {filteredPhotos.length === 0 ? (
          <Card testID="empty-progress-state" style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>No Progress Photos</Text>
            <Text style={styles.emptySubtitle}>
              Take weekly or monthly check-in photos with front, side, and back poses to visually track your transformation.
            </Text>
          </Card>
        ) : (
          <FlatList
            testID="progress-photos-list"
            data={filteredPhotos}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProgressPhotoCard
                testID={`progress-card-${item.id}`}
                media={item}
                isSelectionMode={isSelectionMode}
                isSelected={selectedPhotoIds.includes(item.id)}
                onPress={() => handleCardPress(item)}
                onDelete={!isSelectionMode ? () => handleDeletePhoto(item) : undefined}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
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
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs + 2,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.semibold,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectionCount: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  compareBtn: {
    height: 32,
    paddingHorizontal: spacing.md,
  },
  compareBtnText: {
    fontSize: typography.fontSizes.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  pickerRow: {
    marginBottom: spacing.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
});
