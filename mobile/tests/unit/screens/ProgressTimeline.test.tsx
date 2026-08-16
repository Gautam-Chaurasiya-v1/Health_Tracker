import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgressTimeline } from '../../../src/screens/progress/ProgressTimeline';
import { useMediaStore } from '../../../src/stores/useMediaStore';
import { database } from '../../../src/db';
import { MediaContext, MediaType, PoseType, SyncStatus } from '../../../../shared/types/enums';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockPhotos = [
  {
    id: 'photo-1',
    client_uuid: 'uuid-1',
    media_type: MediaType.Photo,
    context: MediaContext.DietProgress,
    local_uri: 'media/front.jpg',
    file_size_bytes: 2000000,
    mime_type: 'image/jpeg',
    pose_type: PoseType.Front,
    sync_status: SyncStatus.Pending,
    created_at: 1770000000000,
  },
  {
    id: 'photo-2',
    client_uuid: 'uuid-2',
    media_type: MediaType.Photo,
    context: MediaContext.DietProgress,
    local_uri: 'media/side.jpg',
    file_size_bytes: 2000000,
    mime_type: 'image/jpeg',
    pose_type: PoseType.Side,
    sync_status: SyncStatus.Pending,
    created_at: 1770001000000,
  },
];

describe('ProgressTimeline Screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    useMediaStore.setState({
      mediaList: [],
      isLoading: false,
      selectedPoseFilter: 'all',
    });
  });

  it('renders empty state when no progress photos exist', () => {
    const { getByTestId, getByText } = render(<ProgressTimeline />);
    expect(getByTestId('empty-progress-state')).toBeTruthy();
    expect(getByText('No Progress Photos')).toBeTruthy();
  });

  it('renders photos list and allows pose filtering', () => {
    useMediaStore.setState({
      mediaList: mockPhotos,
      selectedPoseFilter: 'all',
    });

    const { getByTestId } = render(<ProgressTimeline />);
    expect(getByTestId('progress-card-photo-1')).toBeTruthy();
    expect(getByTestId('progress-card-photo-2')).toBeTruthy();

    // Filter by front
    fireEvent.press(getByTestId('pose-filter-front'));
    expect(useMediaStore.getState().selectedPoseFilter).toBe(PoseType.Front);
  });

  it('renders date navigation controls on ProgressTimeline', () => {
    const { getByTestId } = render(<ProgressTimeline />);
    expect(getByTestId('date-display')).toBeTruthy();
    expect(getByTestId('prev-date-btn')).toBeTruthy();
    expect(getByTestId('next-date-btn')).toBeTruthy();
  });
});
