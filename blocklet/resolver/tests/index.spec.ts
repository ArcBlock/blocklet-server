/* eslint-disable @typescript-eslint/comma-dangle */
/* eslint-disable prettier/prettier */
import { toBlockletDid } from '@blocklet/meta/lib/did';
import { describe, test, expect, it, mock, afterAll } from 'bun:test';
import cloneDeep from 'lodash/cloneDeep';
import { parseBlocklet, ensureMeta, filterDuplicateComponents, parseOptionalComponents } from '../index';
import { mockOptionalChildrenBlocklet, mockNoOptionalChildren } from './mock-children-data';

mock.module('getBlockletMetaFromUrls', () => {
  return {
    getBlockletMetaFromUrls: mock(() => {
      return {
        meta: {
          did: 'z8ia2birZzhjbXqKnxPUUivmqErdsf3724tr6',
        },
      };
    }),
  };
});

afterAll(() => {
  mock.restore();
});

// This test may fail due to network instability and takes 10–20s
describe('parseBlocklet', () => {
  it(
    'should parse composite blocklet correctly',
    async () => {
      const components = await parseBlocklet(
        'https://test.store.blocklet.dev/api/blocklets/z8ia2birZzhjbXqKnxPUUivmqErdsf3724tr6/blocklet.json'
      );
      expect(components.length).toEqual(3);
    },
    30 * 1000
  );

  it('should parse simple blocklet correctly', async () => {
    const components = await parseBlocklet(
      'https://test.store.blocklet.dev/api/blocklets/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9/blocklet.json'
    );
    expect(components.length).toEqual(1);
  }, 15000);

  it('should parse gateway blocklet correctly', async () => {
    const components = await parseBlocklet(
      'https://test.store.blocklet.dev/api/blocklets/z8ia2kJi2hdqASNBZzRiWQaZ8vshaxgQS67EW/blocklet.json'
    );
    expect(components.length).toEqual(2);
  }, 15000);
});

describe('ensureMeta', () => {
  test('should work as expected', () => {
    expect((ensureMeta as any)({ name: 'aaa', did: toBlockletDid('aaa') })).toEqual({
      name: 'aaa',
      did: toBlockletDid('aaa'),
      bundleName: 'aaa',
      bundleDid: toBlockletDid('aaa'),
    } as any);

    expect((ensureMeta as any)({ name: 'aaa', did: toBlockletDid('aaa') }, { name: 'bbb' })).toEqual({
      name: 'bbb',
      did: toBlockletDid('bbb'),
      bundleName: 'aaa',
      bundleDid: toBlockletDid('aaa'),
    } as any);

    expect(
      (ensureMeta as any)({ name: 'aaa', did: toBlockletDid('aaa') }, { name: 'ccc', did: toBlockletDid('ccc') })
    ).toEqual({
      name: 'ccc',
      did: toBlockletDid('ccc'),
      bundleName: 'aaa',
      bundleDid: toBlockletDid('aaa'),
    } as any);

    expect(() =>
      (ensureMeta as any)({ name: 'aaa', did: toBlockletDid('aaa') }, { name: 'ccc', did: 'not-match' })
    ).toThrow();
    expect(() => (ensureMeta as any)({ name: 'aaa', did: 'not-match' })).toThrow();
    expect(() => (ensureMeta as any)({ name: 'aaa' })).toThrow();
    expect(() => (ensureMeta as any)({ did: 'aaa' })).toThrow();
  });
});

describe('filterDuplicateComponents', () => {
  it('should filter duplicate components', () => {
    const components = [
      { meta: { did: 'component-1', version: '1.0.0' } },
      { meta: { did: 'component-2', version: '2.0.0' } },
      { meta: { did: 'component-3', version: '1.0.0' } },
    ] as any;

    const currents = [
      { meta: { did: 'component-2', version: '1.0.0' } },
      { meta: { did: 'component-3', version: '1.0.0' } },
    ] as any;

    const result = filterDuplicateComponents(components, currents);

    expect(result).toEqual([{ meta: { did: 'component-1', version: '1.0.0' } }]);
  });

  it('should handle empty arrays', () => {
    const result = filterDuplicateComponents([], []);

    expect(result).toEqual([]);
  });

  it('should handle empty currents array', () => {
    const components = [
      { meta: { did: 'component-1', version: '1.0.0' } },
      { meta: { did: 'component-2', version: '2.0.0' } },
    ] as any;

    const currents = [] as any;

    const result = filterDuplicateComponents(components, currents);

    expect(result).toEqual(components);
  });
});

describe('parseOptionalComponents', () => {
  it('should return an empty array when given an empty array', async () => {
    const result = await parseOptionalComponents({} as any);
    expect(result).toEqual([]);
  });

  it(
    'should parse optional components correctly',
    async () => {
      const result = await parseOptionalComponents(cloneDeep(mockOptionalChildrenBlocklet) as any);
      expect(result.length).toEqual(2);
      /**
       * @type {import('../index').TOptionalComponentState}
       */
      const aiKit = result.find((x) => x.meta.name === 'ai-kit');
      expect(
        aiKit.logoUrl.includes(
          `https://store.blocklet.dev/assets/z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ/${aiKit.meta.logo || 'logo.png'}?v=${aiKit.meta.version}`
        )
      ).toBeTruthy();
      expect(aiKit.dependencies).toEqual([
        {
          parentDid: 'z8iZvMrKPa7qy2nxfrKremuSm8bE9Wb9Tu2NA',
          parentName: 'ai-assistant',
          parentTitle: 'AI Assistant',
          required: false,
          mountPoint: true,
        },
      ] as any);
      expect((aiKit as any).mountPoint).toEqual('/ai-kit');
      expect(aiKit.meta.name).toEqual('ai-kit');
    },
    30 * 1000
  );

  it(
    'should parse optional components correctly',
    async () => {
      const result = await parseOptionalComponents(cloneDeep(mockOptionalChildrenBlocklet) as any);
      expect(result.length).toEqual(2);
      const aiKit = result.find((x) => x.meta.name === 'ai-kit');
      expect(
        aiKit.logoUrl.indexOf(
          `https://store.blocklet.dev/assets/z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ/${aiKit.meta.logo || 'logo.png'}?v=${aiKit.meta.version}`
        )
      ).toEqual(0);
      expect(aiKit.dependencies).toEqual([
        {
          parentDid: 'z8iZvMrKPa7qy2nxfrKremuSm8bE9Wb9Tu2NA',
          parentName: 'ai-assistant',
          parentTitle: 'AI Assistant',
          required: false,
          mountPoint: true,
        },
      ] as any);
      expect((aiKit as any).mountPoint).toEqual('/ai-kit');
      expect(aiKit.meta.name).toEqual('ai-kit');
    },
    30 * 1000
  );

  it('should parse no optional components correctly', async () => {
    const result = await parseOptionalComponents(cloneDeep(mockNoOptionalChildren) as any);
    expect(result.length).toEqual(0);
  }, 15000);
});
