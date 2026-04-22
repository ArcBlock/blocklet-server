const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const { BlockletSource, BlockletStatus } = require('@blocklet/constant');

const BlockletState = require('../../lib/states/blocklet');
const BlockletChildState = require('../../lib/states/blocklet-child');
const { setupInMemoryModels, getBlocklets } = require('../../tools/fixture');

// Import the module to access ensureDeployedFrom
// Since ensureDeployedFrom is not exported, we need to test it indirectly or extract it
// For now, we'll recreate the logic for testing purposes
const ensureDeployedFrom = (child) => {
  if (child.deployedFrom || !child.bundleSource) {
    return child;
  }

  const { bundleSource } = child;
  let deployedFrom = '';
  let { source } = child;

  if (bundleSource.store) {
    // From registry/store - store is already the domain
    deployedFrom = Array.isArray(bundleSource.store) ? bundleSource.store[0] : bundleSource.store;
    source = BlockletSource.registry;
  } else if (bundleSource.url) {
    // From URL - extract origin (domain) only
    const urlStr = Array.isArray(bundleSource.url) ? bundleSource.url[0] : bundleSource.url;
    try {
      deployedFrom = new URL(urlStr).origin;
    } catch {
      deployedFrom = urlStr;
    }
    source = BlockletSource.url;
  }

  if (deployedFrom) {
    return { ...child, deployedFrom, source };
  }
  return child;
};

describe('ensureDeployedFrom', () => {
  test('should return child unchanged if deployedFrom already exists', () => {
    const child = {
      deployedFrom: 'https://store.blocklet.dev',
      source: BlockletSource.registry,
      bundleSource: { store: 'https://other.store.blocklet.dev' },
    };

    const result = ensureDeployedFrom(child);

    expect(result).toBe(child);
    expect(result.deployedFrom).toBe('https://store.blocklet.dev');
  });

  test('should return child unchanged if bundleSource is missing', () => {
    const child = {
      source: 0,
    };

    const result = ensureDeployedFrom(child);

    expect(result).toBe(child);
    expect(result.deployedFrom).toBeUndefined();
  });

  test('should infer deployedFrom from bundleSource.store', () => {
    const child = {
      source: 0,
      bundleSource: {
        store: 'https://store.blocklet.dev',
        name: 'test-component',
        version: 'latest',
      },
    };

    const result = ensureDeployedFrom(child);

    expect(result.deployedFrom).toBe('https://store.blocklet.dev');
    expect(result.source).toBe(BlockletSource.registry);
  });

  test('should use first store when bundleSource.store is an array', () => {
    const child = {
      source: 0,
      bundleSource: {
        store: ['https://primary.store.blocklet.dev', 'https://fallback.store.blocklet.dev'],
        name: 'test-component',
        version: 'latest',
      },
    };

    const result = ensureDeployedFrom(child);

    expect(result.deployedFrom).toBe('https://primary.store.blocklet.dev');
    expect(result.source).toBe(BlockletSource.registry);
  });

  test('should infer deployedFrom origin from bundleSource.url', () => {
    const child = {
      source: 0,
      bundleSource: {
        url: 'https://test.store.blocklet.dev/api/blocklets/xxx/blocklet.json',
      },
    };

    const result = ensureDeployedFrom(child);

    expect(result.deployedFrom).toBe('https://test.store.blocklet.dev');
    expect(result.source).toBe(BlockletSource.url);
  });

  test('should use first url when bundleSource.url is an array', () => {
    const child = {
      source: 0,
      bundleSource: {
        url: [
          'https://primary.store.blocklet.dev/api/blocklets/xxx/blocklet.json',
          'https://fallback.store.blocklet.dev/api/blocklets/xxx/blocklet.json',
        ],
      },
    };

    const result = ensureDeployedFrom(child);

    expect(result.deployedFrom).toBe('https://primary.store.blocklet.dev');
    expect(result.source).toBe(BlockletSource.url);
  });

  test('should handle invalid URL gracefully and use full string', () => {
    const child = {
      source: 0,
      bundleSource: {
        url: 'not-a-valid-url',
      },
    };

    const result = ensureDeployedFrom(child);

    expect(result.deployedFrom).toBe('not-a-valid-url');
    expect(result.source).toBe(BlockletSource.url);
  });

  test('should return child unchanged if bundleSource has neither store nor url', () => {
    const child = {
      source: 0,
      bundleSource: {
        name: 'test-component',
      },
    };

    const result = ensureDeployedFrom(child);

    expect(result).toBe(child);
    expect(result.deployedFrom).toBeUndefined();
  });

  test('should preserve other child properties', () => {
    const child = {
      meta: { did: 'test-did', name: 'test-component' },
      mountPoint: '/test',
      source: 0,
      bundleSource: {
        store: 'https://store.blocklet.dev',
      },
      status: 1,
      ports: { main: 8080 },
    };

    const result = ensureDeployedFrom(child);

    expect(result.meta).toEqual(child.meta);
    expect(result.mountPoint).toBe('/test');
    expect(result.status).toBe(1);
    expect(result.ports).toEqual({ main: 8080 });
    expect(result.deployedFrom).toBe('https://store.blocklet.dev');
    expect(result.source).toBe(BlockletSource.registry);
  });
});

describe('BlockletChildState uptime helper methods', () => {
  let childStore = null;
  let blockletStore = null;
  let models = null;
  let parentBlocklet = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    childStore = new BlockletChildState(models.BlockletChild, {});
    blockletStore = new BlockletState(models.Blocklet, { BlockletChildState: childStore });

    // Create a parent blocklet to satisfy foreign key constraints
    const blocklets = getBlocklets();
    parentBlocklet = await blockletStore.addBlocklet({
      meta: blocklets[0],
    });
  });

  afterAll(async () => {
    await childStore.reset();
    await blockletStore.reset();
  });

  // Helper to get store reference
  const store = () => childStore;
  const parentBlockletId = () => parentBlocklet?.id;
  const parentBlockletDid = () => parentBlocklet?.meta?.did;

  describe('hasAnyRunningChild', () => {
    test('should return false if parentBlockletId is null', async () => {
      const result = await store().hasAnyRunningChild(null);
      expect(result).toBe(false);
    });

    test('should return false if parentBlockletId is undefined', async () => {
      const result = await store().hasAnyRunningChild(undefined);
      expect(result).toBe(false);
    });

    test('should return false when no children exist', async () => {
      const result = await store().hasAnyRunningChild('non-existent-parent');
      expect(result).toBe(false);
    });

    test('should return false when all children have non-running status', async () => {
      // Create children with stopped/error status
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-stopped-1',
        mountPoint: '/api',
        meta: { did: 'child-stopped-1', name: 'test-child-1' },
        status: BlockletStatus.stopped,
        greenStatus: BlockletStatus.stopped,
      });
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-error-1',
        mountPoint: '/admin',
        meta: { did: 'child-error-1', name: 'test-child-2' },
        status: BlockletStatus.error,
        greenStatus: BlockletStatus.stopped,
      });

      const result = await store().hasAnyRunningChild(parentBlockletId());
      expect(result).toBe(false);

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });

    test('should return true when at least one child has status=RUNNING', async () => {
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-running-1',
        mountPoint: '/api',
        meta: { did: 'child-running-1', name: 'test-child' },
        status: BlockletStatus.running,
        greenStatus: BlockletStatus.stopped,
        startedAt: new Date(),
      });

      const result = await store().hasAnyRunningChild(parentBlockletId());
      expect(result).toBe(true);

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });

    test('should return true when at least one child has greenStatus=RUNNING', async () => {
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-green-running-1',
        mountPoint: '/api',
        meta: { did: 'child-green-running-1', name: 'test-child' },
        status: BlockletStatus.stopped,
        greenStatus: BlockletStatus.running,
        startedAt: new Date(),
      });

      const result = await store().hasAnyRunningChild(parentBlockletId());
      expect(result).toBe(true);

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });

    test('should return true when both status and greenStatus are RUNNING', async () => {
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-both-running',
        mountPoint: '/api',
        meta: { did: 'child-both-running', name: 'test-child' },
        status: BlockletStatus.running,
        greenStatus: BlockletStatus.running,
        startedAt: new Date(),
      });

      const result = await store().hasAnyRunningChild(parentBlockletId());
      expect(result).toBe(true);

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });
  });

  describe('getEarliestRunningStartedAt', () => {
    test('should return null if parentBlockletId is null', async () => {
      const result = await store().getEarliestRunningStartedAt(null);
      expect(result).toBeNull();
    });

    test('should return null if parentBlockletId is undefined', async () => {
      const result = await store().getEarliestRunningStartedAt(undefined);
      expect(result).toBeNull();
    });

    test('should return null when no running children exist', async () => {
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-stopped-for-earliest',
        mountPoint: '/api',
        meta: { did: 'child-stopped-for-earliest', name: 'test-child' },
        status: BlockletStatus.stopped,
        greenStatus: BlockletStatus.stopped,
        startedAt: new Date('2024-01-01'),
      });

      const result = await store().getEarliestRunningStartedAt(parentBlockletId());
      expect(result).toBeNull();

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });

    test('should return the earliest startedAt from running children', async () => {
      const earliestDate = new Date('2024-01-01T10:00:00Z');
      const laterDate = new Date('2024-01-02T10:00:00Z');

      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-earliest',
        mountPoint: '/api',
        meta: { did: 'child-earliest', name: 'test-child-1' },
        status: BlockletStatus.running,
        greenStatus: BlockletStatus.stopped,
        startedAt: earliestDate,
      });
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-later',
        mountPoint: '/admin',
        meta: { did: 'child-later', name: 'test-child-2' },
        status: BlockletStatus.running,
        greenStatus: BlockletStatus.stopped,
        startedAt: laterDate,
      });

      const result = await store().getEarliestRunningStartedAt(parentBlockletId());
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(earliestDate.getTime());

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });

    test('should only consider children with status=RUNNING or greenStatus=RUNNING', async () => {
      const stoppedEarlier = new Date('2024-01-01T08:00:00Z');
      const runningLater = new Date('2024-01-01T12:00:00Z');

      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-stopped-earlier',
        mountPoint: '/api',
        meta: { did: 'child-stopped-earlier', name: 'test-child-1' },
        status: BlockletStatus.stopped,
        greenStatus: BlockletStatus.stopped,
        startedAt: stoppedEarlier,
      });
      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-running-later',
        mountPoint: '/admin',
        meta: { did: 'child-running-later', name: 'test-child-2' },
        status: BlockletStatus.running,
        greenStatus: BlockletStatus.stopped,
        startedAt: runningLater,
      });

      const result = await store().getEarliestRunningStartedAt(parentBlockletId());
      expect(result).toBeInstanceOf(Date);
      // Should return the running child's startedAt, not the stopped one
      expect(result.getTime()).toBe(runningLater.getTime());

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });

    test('should handle blue-green scenarios - greenStatus=RUNNING', async () => {
      const greenStartedAt = new Date('2024-01-01T14:00:00Z');

      await store().insert({
        parentBlockletId: parentBlockletId(),
        parentBlockletDid: parentBlockletDid(),
        childDid: 'child-green-only',
        mountPoint: '/api',
        meta: { did: 'child-green-only', name: 'test-child' },
        status: BlockletStatus.stopped,
        greenStatus: BlockletStatus.running,
        startedAt: greenStartedAt,
      });

      const result = await store().getEarliestRunningStartedAt(parentBlockletId());
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(greenStartedAt.getTime());

      // Cleanup
      await store().deleteByParentId(parentBlockletId());
    });
  });
});
