import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import { MediaRecordEntity } from '../../../../shared/types/entities';
import { MediaType } from '../../../../shared/types/enums';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../common';

interface MediaThumbnailProps {
  media: MediaRecordEntity;
  onDelete?: () => void;
  size?: number;
  testID?: string;
}

export const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  media,
  onDelete,
  size = 80,
  testID,
}) => {
  const [fullscreenVisible, setFullscreenVisible] = useState(false);

  const fullLocalUri = media.local_uri
    ? `file://${RNFS.DocumentDirectoryPath}/${media.local_uri}`
    : null;

  const handleDelete = () => {
    Alert.alert('Delete Media', 'Are you sure you want to permanently delete this media?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setFullscreenVisible(false);
          if (onDelete) onDelete();
        },
      },
    ]);
  };

  return (
    <View testID={testID} style={[styles.container, { width: size, height: size }]}>
      <TouchableOpacity
        testID={`${testID ?? 'media-thumb'}-btn`}
        onPress={() => setFullscreenVisible(true)}
        style={styles.touchable}
        activeOpacity={0.8}
      >
        {fullLocalUri ? (
          <Image
            testID={`${testID ?? 'media-thumb'}-img`}
            source={{ uri: fullLocalUri }}
            style={styles.image}
          />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackEmoji}>
              {media.media_type === MediaType.Video ? '🎥' : '📷'}
            </Text>
          </View>
        )}

        {media.media_type === MediaType.Video && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>▶ {media.duration_sec ? `${media.duration_sec}s` : 'Video'}</Text>
          </View>
        )}

        {media.pose_type && (
          <View style={styles.poseBadge}>
            <Text style={styles.poseBadgeText}>{media.pose_type}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Fullscreen Preview Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              testID="close-preview-btn"
              onPress={() => setFullscreenVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕ Close</Text>
            </TouchableOpacity>

            {onDelete && (
              <TouchableOpacity
                testID="delete-preview-btn"
                onPress={handleDelete}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.modalContent}>
            {fullLocalUri && (
              <Image
                source={{ uri: fullLocalUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 24,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: spacing.borderRadius.xs,
  },
  videoBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  poseBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: spacing.borderRadius.xs,
  },
  poseBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.bold,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 10,
    paddingBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeText: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteText: {
    color: colors.danger,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  fullscreenImage: {
    width: '100%',
    height: '85%',
  },
});
