import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgressPhotoCard } from '../../../src/components/media/ProgressPhotoCard';
import { MediaContext, MediaType, PoseType, SyncStatus } from '../../../../shared/types/enums';
import { MediaRecordEntity } from '../../../../shared/types/entities';

const mockPhoto: MediaRecordEntity = {
  id: 'photo-1',
  client_uuid: 'uuid-1',
  media_type: MediaType.Photo,
  context: MediaContext.DietProgress,
  local_uri: 'media/test.jpg',
  file_size_bytes: 2000000,
  mime_type: 'image/jpeg',
  pose_type: PoseType.Front,
  sync_status: SyncStatus.Pending,
  created_at: 1770000000000,
};

describe('ProgressPhotoCard', () => {
  it('renders pose type badge and formatted date', () => {
    const { getByText } = render(
      <ProgressPhotoCard media={mockPhoto} bodyWeight={80} weightUnit="kg" onPress={() => {}} />
    );

    expect(getByText('front')).toBeTruthy();
    expect(getByText('80 kg')).toBeTruthy();
  });

  it('handles press and selection checkmark in selection mode', () => {
    const handlePress = jest.fn();
    const { getByText, rerender } = render(
      <ProgressPhotoCard
        media={mockPhoto}
        isSelectionMode={true}
        isSelected={false}
        onPress={handlePress}
      />
    );

    rerender(
      <ProgressPhotoCard
        media={mockPhoto}
        isSelectionMode={true}
        isSelected={true}
        onPress={handlePress}
      />
    );

    expect(getByText('✓')).toBeTruthy();
  });
});
