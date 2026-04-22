import { describe, test, expect } from 'bun:test';
import { getRequiredComponentsLayers } from '../src/get-required-components-layers';

const mockChildren = [
  {
    meta: {
      did: 'did1',
    },
    status: 8,
    dependencies: [
      {
        did: 'did2',
        required: true,
      },
      {
        did: 'did3',
        required: true,
      },
      {
        did: 'did10',
        required: false,
      },
    ],
  },
  {
    meta: {
      did: 'did2',
    },
    status: 8,
    dependencies: [
      {
        did: 'did2-a',
        required: true,
      },
      {
        did: 'did2-b',
        required: true,
      },
      {
        // Not present in children
        did: 'did2-c',
        required: true,
      },
    ],
  },
  {
    meta: {
      did: 'did2-a',
    },
    status: 8,
    dependencies: [],
  },
  {
    meta: {
      did: 'did2-b',
    },
    status: 8,
    dependencies: [
      {
        did: 'did5',
        required: true,
      },
    ],
  },
  {
    meta: {
      did: 'did3',
    },
    status: 1,
    dependencies: [
      {
        did: 'did3-b',
        required: true,
      },
      {
        did: 'did5',
        required: true,
      },
    ],
  },
  {
    meta: {
      did: 'did3-b',
    },
    status: 8,
    dependencies: [],
  },
  {
    meta: {
      did: 'did5',
    },
    status: 8,
    dependencies: [],
  },
  {
    meta: {
      did: 'did10',
    },
    status: 8,
    dependencies: [],
  },
];

describe('get-blocklet-required-dids', () => {
  test('children is null', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did1',
      children: null,
    });
    expect(dids).toEqual([]);

    const dids2 = getRequiredComponentsLayers({
      targetDid: 'did1',
      children: [],
    });
    expect(dids2).toEqual([]);
  });

  test('get deep 1', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did1',
      children: mockChildren,
      deep: 1,
    });
    expect(dids).toEqual([['did2', 'did3']]);
  });

  test('get deep 2', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did1',
      children: mockChildren,
    });
    expect(dids).toEqual([['did5'], ['did2-a', 'did2-b', 'did3-b'], ['did2', 'did3']]);
  });

  test('too deep performance', () => {
    const time = Date.now();
    const dids = getRequiredComponentsLayers({
      targetDid: 'did1',
      children: mockChildren,
      deep: 99,
    });
    expect(dids).toEqual([['did5'], ['did2-a', 'did2-b', 'did3-b'], ['did2', 'did3']]);
    expect(Date.now() - time).toBeLessThan(500);
  });

  test('get not required', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did5',
      children: mockChildren,
    });
    expect(dids).toEqual([]);
  });

  test('two sub has required', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did2',
      children: mockChildren,
    });
    expect(dids).toEqual([['did5'], ['did2-a', 'did2-b']]);
  });

  test('one sub has required', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did3',
      children: mockChildren,
    });
    expect(dids).toEqual([['did3-b', 'did5']]);
  });

  test('one sub has only did2', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did2',
      children: mockChildren,
    });
    expect(dids).toEqual([['did5'], ['did2-a', 'did2-b']]);
  });

  test('one sub has only status: 8', () => {
    const dids = getRequiredComponentsLayers({
      targetDid: 'did1',
      children: mockChildren,
      filter: (child) => child.status === 8,
    });
    expect(dids).toEqual([['did5'], ['did2-a', 'did2-b'], ['did2']]);
  });
});
