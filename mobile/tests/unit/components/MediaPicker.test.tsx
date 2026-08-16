import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MediaPicker } from '../../../src/components/media/MediaPicker';
import { MediaContext, MediaType, PoseType } from '../../../../shared/types/enums';
import * as ImagePicker from 'expo-image-picker';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///captured_photo.jpg' }],
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///gallery_photo.jpg' }],
  }),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
  },
}));

jest.mock('../../../src/services/mediaStorage', () => ({
  checkAvailableStorage: jest.fn().mockResolvedValue({ allowed: true, warning: false }),
  processAndSaveMedia: jest.fn().mockImplementation((params) =>
    Promise.resolve({
      id: 'mock-rec-id',
      client_uuid: 'mock-uuid',
      media_type: params.type,
      context: params.context,
      local_uri: 'media/test.jpg',
      pose_type: params.poseType,
      created_at: Date.now(),
    })
  ),
}));

describe('MediaPicker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders open picker button', () => {
    const { getByTestId } = render(
      <MediaPicker context={MediaContext.Meal} buttonTitle="+ Attach Meal Photo" />
    );
    expect(getByTestId('open-media-picker-btn')).toBeTruthy();
  });

  it('handles camera photo capture flow', async () => {
    const handleCapture = jest.fn();
    const { getByTestId } = render(
      <MediaPicker context={MediaContext.Meal} onMediaCaptured={handleCapture} />
    );

    fireEvent.press(getByTestId('open-media-picker-btn'));

    await waitFor(() => {
      expect(getByTestId('take-photo-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('take-photo-btn'));

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(handleCapture).toHaveBeenCalled();
    });
  });

  it('shows pose selection modal when context is diet_progress', async () => {
    const { getByTestId, getByText } = render(
      <MediaPicker context={MediaContext.DietProgress} />
    );

    fireEvent.press(getByTestId('open-media-picker-btn'));

    await waitFor(() => {
      expect(getByText('Select Progress Pose')).toBeTruthy();
      expect(getByTestId('pose-front-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('pose-side-btn'));

    await waitFor(() => {
      expect(getByText('Attach Media')).toBeTruthy();
    });
  });
});
