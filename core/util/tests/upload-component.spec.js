const { describe, expect, test, mock, spyOn, afterEach, beforeEach, afterAll } = require('bun:test');

// Mock @abtnode/constant must be set before all other mocks
// Mock both the package name and built file path so imports are always intercepted
const abtnodeConstantMock = () => {
  const exports = { MAX_UPLOAD_FILE_SIZE: 50 };
  return {
    ...exports,
    __esModule: true,
    default: exports,
  };
};
mock.module('@abtnode/constant', abtnodeConstantMock);
mock.module('../../constant/dist/index.cjs', abtnodeConstantMock);
mock.module('../../constant/dist/index.mjs', abtnodeConstantMock);

// Mock external dependencies
mock.module('@ocap/mcrypto', () => ({
  types: {
    RoleType: {
      ROLE_BLOCKLET: 'role_blocklet',
    },
  },
}));

mock.module('@ocap/wallet', () => ({
  fromRandom: mock(() => ({
    address: 'test-address-12345',
  })),
}));

mock.module('@blocklet/meta/lib/file', () => ({
  update: mock(),
  read: mock(() => ({
    name: 'test-blocklet',
    title: 'Test Blocklet',
    version: '1.0.0',
    did: 'test-did',
  })),
}));

mock.module('@blocklet/constant', () => ({
  BLOCKLET_GROUPS: ['group1', 'static', 'group3'],
  BLOCKLET_LATEST_SPEC_VERSION: '1.0.0',
  BLOCKLET_DEFAULT_VERSION: '1.0.0',
  BLOCKLET_META_FILE: 'blocklet.yml',
  BLOCKLET_RELEASE_FOLDER_NAME: 'release',
  BLOCKLET_BUNDLE_FOLDER_NAME: 'bundle',
  BLOCKLET_RELEASE_FILE: 'blocklet.json',
}));

mock.module('../lib/zip', () => ({
  zipToDir: mock(),
}));

mock.module('../lib/safe-tar', () => ({
  safeTarExtract: mock(),
}));

mock.module('../lib/create-blocklet-release', () => ({
  createRelease: mock(() => ({
    meta: {
      name: 'test-blocklet',
      version: '1.0.0',
      did: 'test-did',
    },
  })),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { update: updateMetaFile, read: readMetaFile } = require('@blocklet/meta/lib/file');

const { zipToDir } = require('../lib/zip');
const { safeTarExtract } = require('../lib/safe-tar');
const { createRelease } = require('../lib/create-blocklet-release');

const {
  checkFileExist,
  onUploadComponent,
  updateComponentDid,
  removeUploadFile,
  hasHtmlFile,
} = require('../lib/upload-component');

describe('upload-component', () => {
  let tempDir;
  let testDir;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `upload-component-test-${Date.now()}`);
    testDir = path.join(tempDir, 'test');
    await fs.ensureDir(testDir);

    // Reset mocks
    mock.clearAllMocks();

    spyOn(console, 'error').mockReturnValue();
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('hasHtmlFile', () => {
    test('should return true if index.html exists', async () => {
      await fs.writeFile(path.join(testDir, 'index.html'), '<html></html>');
      expect(hasHtmlFile(testDir)).toBe(true);
    });

    test('should return true if index.htm exists', async () => {
      await fs.writeFile(path.join(testDir, 'index.htm'), '<html></html>');
      expect(hasHtmlFile(testDir)).toBe(true);
    });

    test('should return false if no html files exist', () => {
      expect(hasHtmlFile(testDir)).toBe(false);
    });

    test('should return false for non-existent directory', () => {
      expect(hasHtmlFile('/non/existent/dir')).toBe(false);
    });
  });

  describe('checkFileExist', () => {
    beforeEach(async () => {
      // Create test directory structure
      await fs.ensureDir(path.join(testDir, 'subdir1'));
      await fs.ensureDir(path.join(testDir, 'subdir2', 'nested'));

      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'subdir1', 'file2.txt'), 'content2');
      await fs.writeFile(path.join(testDir, 'subdir2', 'nested', 'file3.txt'), 'content3');
      await fs.writeFile(path.join(testDir, 'blocklet.yml'), 'blocklet config');
      await fs.writeFile(path.join(testDir, 'subdir1', 'index.html'), '<html></html>');
    });

    test('should find files in current directory first', async () => {
      const result = await checkFileExist(testDir, ['blocklet.yml', 'file1.txt']);
      expect(result).toEqual({
        'blocklet.yml': 'blocklet.yml',
        'file1.txt': 'file1.txt',
      });
    });

    test('should find files in subdirectories', async () => {
      const result = await checkFileExist(testDir, ['file2.txt', 'file3.txt']);
      expect(result).toEqual({
        'file2.txt': path.join('subdir1', 'file2.txt'),
        'file3.txt': path.join('subdir2', 'nested', 'file3.txt'),
      });
    });

    test('should return empty object for empty filenames array', async () => {
      const result = await checkFileExist(testDir, []);
      expect(result).toEqual({});
    });

    test('should return empty object for invalid directory', async () => {
      const result = await checkFileExist('/invalid/dir', ['file.txt']);
      expect(result).toEqual({});
    });

    test('should handle relative paths correctly', async () => {
      const result = await checkFileExist(testDir, ['index.html'], testDir);
      expect(result).toEqual({
        'index.html': path.join('subdir1', 'index.html'),
      });
    });

    test('should respect maximum search depth', async () => {
      // create deeply nested directory structure (more than 5 levels)
      const deepDir = path.join(testDir, 'level1', 'level2', 'level3', 'level4', 'level5', 'level6');
      await fs.ensureDir(deepDir);
      await fs.writeFile(path.join(deepDir, 'deep-file.txt'), 'deep content');

      // default max depth is 5, so the level-6 file should not be found
      const result = await checkFileExist(testDir, ['deep-file.txt']);
      expect(result).toEqual({});
    });

    test('should find files within maximum depth', async () => {
      // create a file exactly within the depth limit (level 5)
      const levelDir = path.join(testDir, 'level1', 'level2', 'level3', 'level4', 'level5');
      await fs.ensureDir(levelDir);
      await fs.writeFile(path.join(levelDir, 'within-limit.txt'), 'content');

      // should find the level-5 file
      const result = await checkFileExist(testDir, ['within-limit.txt']);
      expect(result).toEqual({
        'within-limit.txt': path.join('level1', 'level2', 'level3', 'level4', 'level5', 'within-limit.txt'),
      });
    });

    test('should allow custom maximum depth', async () => {
      // create a file 3 levels deep
      const customDeepDir = path.join(testDir, 'custom1', 'custom2', 'custom3');
      await fs.ensureDir(customDeepDir);
      await fs.writeFile(path.join(customDeepDir, 'custom-file.txt'), 'custom content');

      // with max depth 2, should not find the level-3 file
      const result1 = await checkFileExist(testDir, ['custom-file.txt'], null, 2);
      expect(result1).toEqual({});

      // with max depth 3, should find the level-3 file
      const result2 = await checkFileExist(testDir, ['custom-file.txt'], null, 3);
      expect(result2).toEqual({
        'custom-file.txt': path.join('custom1', 'custom2', 'custom3', 'custom-file.txt'),
      });
    });
  });

  describe('onUploadComponent', () => {
    let mockNode;
    let mockBlocklet;
    let mockUser;
    let uploadMetadata;

    beforeEach(async () => {
      mockNode = {
        dataDirs: {
          tmp: tempDir,
        },
      };

      mockBlocklet = {
        env: {
          dataDir: tempDir,
        },
      };

      mockUser = {
        fullName: 'Test User',
        email: 'test@example.com',
      };

      uploadMetadata = {
        id: 'test-file-id',
        size: 1024,
        metadata: {
          filename: 'test-component.zip',
          filetype: 'application/zip',
        },
      };

      // Create mock source file
      await fs.writeFile(path.join(tempDir, 'test-file-id'), 'mock file content');
    });

    test('should throw error if file not found', async () => {
      uploadMetadata.id = 'non-existent-file';

      await expect(onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser)).rejects.toThrow(
        'File not found: non-existent-file'
      );
    });

    test('should throw error for unsupported file type', async () => {
      uploadMetadata.metadata.filetype = 'application/pdf';

      await expect(onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser)).rejects.toThrow(
        'Unsupported file type: application/pdf'
      );
    });

    test('should throw error if file size exceeds limit', async () => {
      uploadMetadata.size = 100 * 1024 * 1024; // 100MB

      await expect(onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser)).rejects.toThrow(
        'File size exceeds the limit: 50MB'
      );
    });

    test('should process HTML file successfully', async () => {
      uploadMetadata.metadata.filetype = 'text/html';
      uploadMetadata.metadata.filename = 'index.html';

      const result = await onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser);

      expect(result).toMatchObject({
        filename: 'test-file-id',
        size: 1024,
        originalname: 'index.html',
        mimetype: 'text/html',
        meta: expect.any(Object),
        inputUrl: expect.stringMatching(/^file:\/\//),
      });

      expect(createRelease).toHaveBeenCalled();
      expect(updateMetaFile).toHaveBeenCalled();
    });

    test('should process ZIP file successfully', async () => {
      // Mock zipToDir to simulate successful extraction
      // make the zipToDir mock actually create files to simulate real extraction
      zipToDir.mockImplementation(async (srcFile, destDir) => {
        // simulate extracted file structure
        await fs.ensureDir(destDir);
        await fs.writeFile(path.join(destDir, 'index.html'), '<html></html>');
      });

      const result = await onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser);

      expect(result).toMatchObject({
        filename: 'test-file-id',
        size: 1024,
        originalname: 'test-component.zip',
        mimetype: 'application/zip',
        meta: expect.any(Object),
        inputUrl: expect.stringMatching(/^file:\/\//),
      });

      expect(zipToDir).toHaveBeenCalled();
      expect(createRelease).toHaveBeenCalled();
    });

    test('should process GZIP file successfully', async () => {
      uploadMetadata.metadata.filetype = 'application/gzip';
      uploadMetadata.metadata.filename = 'test-component.tar.gz';

      safeTarExtract.mockImplementation(async ({ cwd }) => {
        await fs.ensureDir(cwd);
        await fs.writeFile(path.join(cwd, 'blocklet.yml'), 'name: test');
      });

      const result = await onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser);

      expect(result).toMatchObject({
        filename: 'test-file-id',
        size: 1024,
        originalname: 'test-component.tar.gz',
        mimetype: 'application/gzip',
        meta: expect.any(Object),
        inputUrl: expect.stringMatching(/^file:\/\//),
      });

      expect(safeTarExtract).toHaveBeenCalledWith({
        file: path.join(tempDir, 'test-file-id'),
        cwd: expect.any(String),
      });
      expect(createRelease).toHaveBeenCalled();
    });

    test('should throw error for invalid archive', async () => {
      zipToDir.mockRejectedValue(new Error('Invalid archive'));

      await expect(onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser)).rejects.toThrow(
        'Only zip or gz archives are supported as resources.'
      );
    });

    test('should throw error if required files missing in archive', async () => {
      // Mock zipToDir to create only irrelevant files
      zipToDir.mockImplementation(async (srcFile, destDir) => {
        // simulate extraction with only unrelated files
        await fs.ensureDir(destDir);
        await fs.writeFile(path.join(destDir, 'some-other-file.txt'), 'content');
        await fs.writeFile(path.join(destDir, 'README.md'), 'readme content');
      });

      await expect(onUploadComponent(mockNode, uploadMetadata, mockBlocklet, mockUser)).rejects.toThrow(
        'Unable to parse the uploaded file, missing blocklet.yml or index.html or index.htm'
      );
    });
  });

  describe('updateComponentDid', () => {
    let testUrl;
    let mockReleaseDir;
    let mockBundleDir;
    let mockBlockletYmlPath;

    beforeEach(async () => {
      mockReleaseDir = path.join(testDir, 'release');
      mockBundleDir = path.join(testDir, 'bundle');
      mockBlockletYmlPath = path.join(mockBundleDir, 'blocklet.yml');

      await fs.ensureDir(mockReleaseDir);
      await fs.ensureDir(mockBundleDir);

      testUrl = `file://${path.join(mockReleaseDir, 'blocklet.json')}`;

      // Mock existing meta file
      readMetaFile.mockResolvedValue({
        name: 'test-blocklet',
        version: '1.0.0',
        did: 'old-did',
      });
    });

    test('should update DID successfully when different', async () => {
      const newDid = 'new-test-did';

      const result = await updateComponentDid(testUrl, newDid);

      expect(readMetaFile).toHaveBeenCalledWith(mockBlockletYmlPath);
      expect(updateMetaFile).toHaveBeenCalledWith(mockBlockletYmlPath, {
        name: 'test-blocklet',
        version: '1.0.0',
        did: newDid,
      });
      expect(createRelease).toHaveBeenCalled();
      expect(result).toEqual({
        name: 'test-blocklet',
        version: '1.0.0',
        did: 'test-did',
      });
    });

    test('should skip update when DID is the same', async () => {
      const sameDid = 'test-did';

      // Mock readMetaFile to return DID that matches input
      const mockExistingMeta = {
        name: 'test-blocklet',
        version: '1.0.0',
        did: sameDid,
      };
      readMetaFile.mockResolvedValue(mockExistingMeta);

      const result = await updateComponentDid(testUrl, sameDid);

      expect(readMetaFile).toHaveBeenCalledWith(mockBlockletYmlPath);
      // updateMetaFile and createRelease should not be called because DID is unchanged
      expect(updateMetaFile).not.toHaveBeenCalled();
      expect(createRelease).not.toHaveBeenCalled();
      // should directly return existing meta (existingMeta)
      expect(result).toEqual(mockExistingMeta);
    });

    test('should throw error for invalid URL format', async () => {
      const invalidUrl = 'http://example.com/blocklet.json';

      await expect(updateComponentDid(invalidUrl, 'new-did')).rejects.toThrow('URL must start with file://');
    });
  });

  describe('removeUploadFile', () => {
    let testUrl;
    let mockComponentDir;

    beforeEach(async () => {
      mockComponentDir = path.join(testDir, 'component');
      const mockReleaseDir = path.join(mockComponentDir, 'release');

      await fs.ensureDir(mockReleaseDir);
      await fs.writeFile(path.join(mockReleaseDir, 'blocklet.json'), '{}');
      await fs.writeFile(path.join(mockComponentDir, 'test-file.txt'), 'test content');

      testUrl = `file://${path.join(mockReleaseDir, 'blocklet.json')}`;
    });

    test('should remove upload file successfully', async () => {
      expect(await fs.pathExists(mockComponentDir)).toBe(true);

      await removeUploadFile(testUrl);

      // Component directory should be removed
      expect(await fs.pathExists(mockComponentDir)).toBe(false);
    });

    test('should throw error for invalid URL', async () => {
      await expect(removeUploadFile('http://example.com/blocklet.json')).rejects.toThrow('URL must start with file://');
    });

    test('should handle non-existent directory gracefully', async () => {
      const invalidUrl = 'file:///non/existent/path/blocklet.json';

      // should not throw because directory existence is checked first now
      await expect(removeUploadFile(invalidUrl)).resolves.toBeUndefined();
    });

    test('should throw error when removal fails', async () => {
      // Mock fs.remove to throw and simulate deletion failure
      const originalRemove = fs.remove;
      fs.remove = mock().mockRejectedValue(new Error('Permission denied'));

      // test with an existing directory path
      await expect(removeUploadFile(testUrl)).rejects.toThrow('Permission denied');

      // restore original method
      fs.remove = originalRemove;
    });
  });
});
