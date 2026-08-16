// Mock for react-native/setup-env and native modules
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/app/documents',
  CachesDirectoryPath: '/mock/app/caches',
  getFSInfo: jest.fn().mockResolvedValue({ freeSpace: 1024 * 1024 * 1000 }),
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(true),
  copyFile: jest.fn().mockResolvedValue(true),
  writeFile: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue(''),
  unlink: jest.fn().mockResolvedValue(true),
  stat: jest.fn().mockResolvedValue({ size: 1024 * 1024 * 2 }),
}));

jest.mock('react-native-compressor', () => ({
  Image: {
    compress: jest.fn().mockImplementation((uri) => Promise.resolve(`compressed_${uri}`)),
  },
  Video: {
    compress: jest.fn().mockImplementation((uri) => Promise.resolve(`compressed_${uri}`)),
  },
}));
