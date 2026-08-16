import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../common';
import { MediaContext, MediaType, PoseType } from '../../../../shared/types/enums';
import { MediaRecordEntity } from '../../../../shared/types/entities';
import { useMediaStore } from '../../stores/useMediaStore';
import { checkAvailableStorage } from '../../services/mediaStorage';

interface MediaPickerProps {
  context: MediaContext;
  contextId?: string;
  onMediaCaptured?: (record: MediaRecordEntity) => void;
  allowVideo?: boolean;
  buttonTitle?: string;
  testID?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  context,
  contextId,
  onMediaCaptured,
  allowVideo = false,
  buttonTitle = '+ Attach Photo',
  testID,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [poseModalVisible, setPoseModalVisible] = useState(false);
  const [selectedPose, setSelectedPose] = useState<PoseType>(PoseType.Front);
  const [isProcessing, setIsProcessing] = useState(false);

  const captureMedia = useMediaStore((s) => s.captureMedia);

  const handleOpenPicker = async () => {
    // Check storage space first
    const storage = await checkAvailableStorage();
    if (!storage.allowed) {
      Alert.alert('Storage Blocked', storage.message || 'Storage is too low (<100MB) to capture media.');
      return;
    }
    if (storage.warning) {
      Alert.alert('Storage Warning', storage.message || 'Device storage is low (<500MB).');
    }

    if (context === MediaContext.DietProgress) {
      setPoseModalVisible(true);
    } else {
      setModalVisible(true);
    }
  };

  const handlePoseSelected = (pose: PoseType) => {
    setSelectedPose(pose);
    setPoseModalVisible(false);
    setModalVisible(true);
  };

  const handleCameraCapture = async (mediaType: MediaType) => {
    setModalVisible(false);
    setIsProcessing(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take photos or record videos.');
        setIsProcessing(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes:
          mediaType === MediaType.Photo
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: mediaType === MediaType.Photo,
        quality: 0.9,
        videoMaxDuration: 60, // Max 60 seconds
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const record = await captureMedia({
          rawUri: asset.uri,
          type: mediaType,
          context,
          sessionId: context === MediaContext.Workout ? contextId : undefined,
          entryId: context === MediaContext.Exercise ? contextId : undefined,
          dietLogId: context === MediaContext.DietProgress ? contextId : undefined,
          mealEntryId: context === MediaContext.Meal ? contextId : undefined,
          poseType: context === MediaContext.DietProgress ? selectedPose : undefined,
          durationSec: asset.duration ? Math.round(asset.duration) : undefined,
        });

        if (onMediaCaptured) {
          onMediaCaptured(record);
        }
      }
    } catch (err: any) {
      Alert.alert('Capture Failed', err.message || 'Could not process media.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGalleryPhotoPick = async () => {
    setModalVisible(false);
    setIsProcessing(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required to choose photos.');
        setIsProcessing(false);
        return;
      }

      // Photos only - gallery video is strictly forbidden in V1
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const record = await captureMedia({
          rawUri: asset.uri,
          type: MediaType.Photo,
          context,
          sessionId: context === MediaContext.Workout ? contextId : undefined,
          entryId: context === MediaContext.Exercise ? contextId : undefined,
          dietLogId: context === MediaContext.DietProgress ? contextId : undefined,
          mealEntryId: context === MediaContext.Meal ? contextId : undefined,
          poseType: context === MediaContext.DietProgress ? selectedPose : undefined,
        });

        if (onMediaCaptured) {
          onMediaCaptured(record);
        }
      }
    } catch (err: any) {
      Alert.alert('Import Failed', err.message || 'Could not process photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View testID={testID} style={styles.container}>
      <Button
        testID="open-media-picker-btn"
        title={buttonTitle}
        variant="ghost"
        onPress={handleOpenPicker}
        loading={isProcessing}
      />

      {/* Pose Selection Modal (For Diet Progress) */}
      <Modal
        visible={poseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPoseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Progress Pose</Text>
            <Text style={styles.modalSubtitle}>Choose the orientation for this check-in photo.</Text>

            <View style={styles.poseOptionsRow}>
              <TouchableOpacity
                testID="pose-front-btn"
                style={[styles.poseOption, selectedPose === PoseType.Front && styles.poseOptionActive]}
                onPress={() => handlePoseSelected(PoseType.Front)}
              >
                <Text style={styles.poseOptionEmoji}>👤</Text>
                <Text style={styles.poseOptionText}>Front</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="pose-side-btn"
                style={[styles.poseOption, selectedPose === PoseType.Side && styles.poseOptionActive]}
                onPress={() => handlePoseSelected(PoseType.Side)}
              >
                <Text style={styles.poseOptionEmoji}>🚶</Text>
                <Text style={styles.poseOptionText}>Side</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="pose-back-btn"
                style={[styles.poseOption, selectedPose === PoseType.Back && styles.poseOptionActive]}
                onPress={() => handlePoseSelected(PoseType.Back)}
              >
                <Text style={styles.poseOptionEmoji}>🔙</Text>
                <Text style={styles.poseOptionText}>Back</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Cancel"
              variant="ghost"
              style={styles.cancelButton}
              onPress={() => setPoseModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Media Source Action Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Attach Media</Text>
            <Text style={styles.modalSubtitle}>All media is compressed and kept 100% on your device.</Text>

            <TouchableOpacity
              testID="take-photo-btn"
              style={styles.actionRow}
              onPress={() => handleCameraCapture(MediaType.Photo)}
            >
              <Text style={styles.actionIcon}>📷</Text>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Take Photo</Text>
                <Text style={styles.actionSubtitle}>Capture directly with camera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              testID="choose-gallery-btn"
              style={styles.actionRow}
              onPress={handleGalleryPhotoPick}
            >
              <Text style={styles.actionIcon}>🖼️</Text>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Choose from Gallery</Text>
                <Text style={styles.actionSubtitle}>Select existing photo</Text>
              </View>
            </TouchableOpacity>

            {allowVideo && (
              <TouchableOpacity
                testID="record-video-btn"
                style={styles.actionRow}
                onPress={() => handleCameraCapture(MediaType.Video)}
              >
                <Text style={styles.actionIcon}>🎥</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Record Form Video</Text>
                  <Text style={styles.actionSubtitle}>In-app record (max 60s)</Text>
                </View>
              </TouchableOpacity>
            )}

            <Button
              title="Cancel"
              variant="ghost"
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  poseOptionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  poseOption: {
    flex: 1,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: spacing.borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  poseOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  poseOptionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  poseOptionText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
});
