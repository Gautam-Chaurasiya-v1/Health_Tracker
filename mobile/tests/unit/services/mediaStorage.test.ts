import {
  checkAvailableStorage,
  processAndSaveMedia,
  deleteLocalMedia,
  MEDIA_LIMITS,
} from '../../../src/services/mediaStorage';
import { database } from '../../../src/db';
import { MediaContext, MediaType, PoseType } from '../../../../shared/types/enums';
import RNFS from 'react-native-fs';

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/app/documents',
  getFSInfo: jest.fn().mockResolvedValue({ freeSpace: 1024 * 1024 * 1000 }), // 1GB
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(true),
  copyFile: jest.fn().mockResolvedValue(true),
  writeFile: jest.fn().mockResolvedValue(true),
  unlink: jest.fn().mockResolvedValue(true),
  stat: jest.fn().mockResolvedValue({ size: 1024 * 1024 * 2 }), // 2MB
}));

jest.mock('react-native-compressor', () => ({
  Image: {
    compress: jest.fn().mockImplementation((uri) => Promise.resolve(`compressed_${uri}`)),
  },
  Video: {
    compress: jest.fn().mockImplementation((uri) => Promise.resolve(`compressed_${uri}`)),
  },
}));

describe('mediaStorage service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('allows media capture when free storage > 500MB', async () => {
    (RNFS.getFSInfo as jest.Mock).mockResolvedValueOnce({ freeSpace: 1024 * 1024 * 800 });
    const result = await checkAvailableStorage();
    expect(result.allowed).toBe(true);
    expect(result.warning).toBe(false);
  });

  it('warns when storage is between 100MB and 500MB', async () => {
    (RNFS.getFSInfo as jest.Mock).mockResolvedValueOnce({ freeSpace: 1024 * 1024 * 300 });
    const result = await checkAvailableStorage();
    expect(result.allowed).toBe(true);
    expect(result.warning).toBe(true);
  });

  it('blocks capture when storage is < 100MB', async () => {
    (RNFS.getFSInfo as jest.Mock).mockResolvedValueOnce({ freeSpace: 1024 * 1024 * 50 });
    const result = await checkAvailableStorage();
    expect(result.allowed).toBe(false);
    expect(result.warning).toBe(true);
  });

  it('processes, compresses, and saves photo record to DB and filesystem', async () => {
    const record = await processAndSaveMedia({
      rawUri: 'file:///path/to/raw_photo.jpg',
      type: MediaType.Photo,
      context: MediaContext.DietProgress,
      dietLogId: 'diet-log-1',
      poseType: PoseType.Front,
    });

    expect(record.client_uuid).toBeTruthy();
    expect(record.media_type).toBe(MediaType.Photo);
    expect(record.pose_type).toBe(PoseType.Front);
    expect(record.local_uri).toContain('media/');

    const records = await database.get('media_records').query().fetch();
    expect(records.length).toBe(1);
    expect((records[0] as any).clientUuid).toBe(record.client_uuid);
  });

  it('deletes media record and unlinks file from filesystem', async () => {
    const record = await processAndSaveMedia({
      rawUri: 'file:///path/to/photo.jpg',
      type: MediaType.Photo,
      context: MediaContext.Meal,
      mealEntryId: 'meal-1',
    });

    await deleteLocalMedia(record.id);
    expect(RNFS.unlink).toHaveBeenCalled();

    const records = await database.get('media_records').query().fetch();
    expect(records.length).toBe(0);
  });
});
