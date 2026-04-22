const { test, expect, describe, beforeEach, afterAll, mock, spyOn } = require('bun:test');

const mockValidate = mock();
mock.module('@blocklet/meta/lib/entry', () => {
  return mockValidate;
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const fs = require('fs-extra');
const { BlockletSource, BlockletGroup } = require('@blocklet/constant');
const { toBase58 } = require('@ocap/util');
const sleep = require('@abtnode/util/lib/sleep');
const Downloader = require('../../../lib/blocklet/downloader/blocklet-downloader');

const cache = {
  get: mock(),
  set: mock(),
};

const logger = {
  error: mock(),
  info: mock(),
};

const preDownload = mock();
const postDownload = mock();

const downloader = new Downloader({ installDir: 'mock', downloadDir: 'mock', cache, logger });

beforeEach(() => {
  cache.get.mockRestore();
  cache.set.mockRestore();
  logger.error.mockRestore();
  logger.info.mockRestore();
  preDownload.mockRestore();
  postDownload.mockRestore();
  mockValidate.mockRestore();

  spyOn(fs, 'existsSync').mockReturnValue(true);

  spyOn(downloader.bundleDownloader, 'download').mockResolvedValue({
    isCancelled: false,
  });
});

const blocklet = {
  meta: {
    name: 'metaName1',
    did: 'metaDid1',
    bundleName: 'bundleName1',
    bundleDid: 'bundleDid1',
    version: '1.0.0',
    dist: {
      tarball: 'xxxx',
      integrity: 'integrity1',
    },
  },
};

const app = {
  meta: {
    name: 'appName1',
    did: 'appDid1',
    bundleName: 'appBundleName1',
    bundleDid: 'appBundleDid1',
    version: '1.0.0',
    group: BlockletGroup.gateway,
  },
  source: BlockletSource.custom,
  children: [blocklet],
};

describe('getDownloadList', () => {
  test('should download if exist bundle but not found integrity', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    cache.get.mockReturnValue([]);

    await downloader.download(app, {
      preDownload,
      postDownload,
    });
    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
    });

    expect(postDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
      isCancelled: false,
    });
  });

  test('should download if exist bundle but integrity is different', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    await downloader.download(app, { preDownload });

    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
    });
  });

  test('should download registry source blocklet', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    cache.get.mockReturnValue([]);

    await downloader.download({ ...app, children: [{ ...blocklet, source: 0 }] }, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
    });
  });

  test('should download url source blocklet', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    cache.get.mockReturnValue([{ bundleId: 'bundleName1@1.0.0', integrity: 'different' }]);

    await downloader.download({ ...app, children: [{ ...blocklet, source: 3 }] }, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
    });
  });

  test('should download if bundle does not exist in install dir', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(false);

    await downloader.download(app, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
    });
  });

  test('should download if bundle exists but is broken in install dir', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    mockValidate.mockImplementation(() => {
      throw new Error('test');
    });

    await downloader.download(app, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
    });
  });

  test('should not download development component', async () => {
    await downloader.download({ ...app, children: [{ ...blocklet, mode: 'development' }] }, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({ downloadComponentIds: [], downloadList: [] });
  });

  test('should not download local source blocklet', async () => {
    await downloader.download({ ...app, children: [{ ...blocklet, source: BlockletSource.local }] }, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({ downloadComponentIds: [], downloadList: [] });
  });

  test('should not download custom source blocklet', async () => {
    await downloader.download({ ...app, children: [{ ...blocklet, source: 2 }] }, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({ downloadComponentIds: [], downloadList: [] });
  });

  test('should not download upload source blocklet', async () => {
    await downloader.download({ ...app, children: [{ ...blocklet, source: 4 }] }, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({ downloadComponentIds: [], downloadList: [] });
  });

  test('should not download upload source blocklet even if bundle is broken', async () => {
    mockValidate.mockImplementation(() => {
      throw new Error('test');
    });
    await downloader.download({ ...app, children: [{ ...blocklet, source: 4 }] }, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({ downloadComponentIds: [], downloadList: [] });
  });

  test('should not download if exist bundle with same integrity', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    cache.get.mockReturnValue([{ bundleId: 'bundleName1@1.0.0', integrity: toBase58(blocklet.meta.dist.integrity) }]);
    await downloader.download(blocklet, { preDownload });
    expect(preDownload).toHaveBeenCalledWith({ downloadComponentIds: [], downloadList: [] });
  });

  test('should not download registry source blocklet if bundle is available and not check integrity ', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    cache.get.mockReturnValue([]);

    const onProgress = mock();
    await downloader.download(
      { ...blocklet, children: [{ ...blocklet, source: 0 }] },
      { preDownload, onProgress, skipCheckIntegrity: true }
    );
    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [],
      downloadList: [],
    });
    await sleep(100);
    expect(onProgress).toBeCalledTimes(2);
  });

  test('should skip duplicate bundle', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);
    cache.get.mockReturnValue([]);

    const child1 = {
      meta: {
        name: 'metaChildName1',
        did: 'metaChild1Did1',
        bundleName: 'bundleName2',
        bundleDid: 'bundleDid2',
        version: '1.0.0',
        dist: {
          tarball: 'xxxx',
          integrity: 'integrity2',
        },
      },
    };

    const child2 = {
      meta: {
        name: 'metaChildName2',
        did: 'metaChild1Did2',
        bundleName: 'bundleName2',
        bundleDid: 'bundleDid2',
        version: '1.0.0',
        dist: {
          tarball: 'xxxx',
          integrity: 'integrity2',
        },
      },
    };

    await downloader.download({ ...app, children: [child1, child2] }, { preDownload });
    // child2 should not in download list
    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [child1.meta.did],
      downloadList: [child1.meta],
    });
  });

  test('should download container that has downloadable bundle source', async () => {
    spyOn(fs, 'existsSync').mockReturnValue(true);

    const app1 = {
      ...app,
      meta: {
        ...app.meta,
        group: BlockletGroup.gateway,
        dist: {
          tarball: 'xxxx',
          integrity: 'integrity1',
        },
      },
      source: BlockletSource.url,
      deployedFrom: 'https://xxx',
    };

    await downloader.download(app1, { preDownload });

    expect(preDownload).toHaveBeenCalledWith({
      downloadComponentIds: [app1.meta.did, blocklet.meta.did],
      downloadList: [app1.meta, blocklet.meta],
    });
  });
});

describe('download result', () => {
  test('isCancelled is false', async () => {
    spyOn(downloader.bundleDownloader, 'download').mockResolvedValue({
      isCancelled: false,
    });

    const res = await downloader.download(app, { postDownload });

    expect(res).toEqual({ isCancelled: false });

    expect(postDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
      isCancelled: false,
    });
  });

  test('isCancelled is true', async () => {
    // spyOn(downloader.bundleDownloader, 'download').mockResolvedValue({
    //   isCancelled: true,
    // });

    await downloader.bundleDownloader.cancelDownload(app.meta.did);
    const isCancelled = await downloader.bundleDownloader.isCanceled(app.meta.did);
    expect(isCancelled).toEqual(true);
    const res = await downloader.download(app, { postDownload });

    expect(res).toEqual({ isCancelled: true });

    expect(postDownload).toHaveBeenCalledWith({
      downloadComponentIds: [blocklet.meta.did],
      downloadList: [blocklet.meta],
      isCancelled: true,
    });
  });

  test('should throw error', () => {
    spyOn(downloader.bundleDownloader, 'download').mockImplementation(() => {
      throw new Error('test');
    });

    expect(downloader.download(app)).rejects.toThrow('test');
  });
});

describe('cancel download', () => {
  test('should work', async () => {
    await downloader.cancelDownload('did123');

    const isCancelled = await downloader.bundleDownloader.isCanceled('did123');

    expect(isCancelled).toEqual(true);
  });
});
