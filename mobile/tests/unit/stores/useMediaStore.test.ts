import { useMediaStore } from '../../../src/stores/useMediaStore';
import { database } from '../../../src/db';
import { MediaContext, MediaType, PoseType } from '../../../../shared/types/enums';

jest.mock('../../../src/services/mediaStorage', () => ({
  processAndSaveMedia: jest.fn().mockImplementation((params) =>
    Promise.resolve({
      id: 'media-1',
      client_uuid: 'uuid-1',
      media_type: params.type,
      context: params.context,
      local_uri: 'media/uuid-1.jpg',
      pose_type: params.poseType,
      created_at: Date.now(),
    })
  ),
  deleteLocalMedia: jest.fn().mockResolvedValue(undefined),
}));

describe('useMediaStore', () => {
  beforeEach(() => {
    useMediaStore.setState({
      mediaList: [],
      isLoading: false,
      selectedPoseFilter: 'all',
    });
  });

  it('updates pose filter', () => {
    useMediaStore.getState().setPoseFilter(PoseType.Side);
    expect(useMediaStore.getState().selectedPoseFilter).toBe(PoseType.Side);
  });

  it('captures media and adds to store list', async () => {
    const record = await useMediaStore.getState().captureMedia({
      rawUri: 'file:///photo.jpg',
      type: MediaType.Photo,
      context: MediaContext.DietProgress,
      poseType: PoseType.Front,
    });

    expect(record.id).toBe('media-1');
    expect(useMediaStore.getState().mediaList.length).toBe(1);
  });

  it('deletes media and removes from store list', async () => {
    useMediaStore.setState({
      mediaList: [
        {
          id: 'media-1',
          client_uuid: 'uuid-1',
          media_type: MediaType.Photo,
          context: MediaContext.Meal,
          file_size_bytes: 1000,
          mime_type: 'image/jpeg',
          sync_status: 'pending' as any,
          created_at: Date.now(),
        },
      ],
    });

    await useMediaStore.getState().deleteMedia('media-1');
    expect(useMediaStore.getState().mediaList.length).toBe(0);
  });
});
