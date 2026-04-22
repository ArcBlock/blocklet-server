import { describe, it, expect } from 'bun:test';
import { getMountPoints } from '../src/util';

// getMountPoints
describe('getMountPoints', () => {
  const child = {
    mountPoint: '/docs',
    interfaces: [
      {
        type: 'web',
      },
    ],
    meta: {
      bundleDid: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu',
      bundleName: 'did-comments',
      version: '2.4.115',
      title: 'Discuss Kit',
      interfaces: [
        {
          type: 'web',
        },
      ],
    },
  };
  it('should return an empty array if the blocklet has no children', () => {
    const blocklet = {
      meta: { did: 'did', name: 'name', version: 'version' },
      children: [] as any[],
    };
    expect(getMountPoints(blocklet).filter((item) => item.title)).toEqual([]);
  });

  it('has status and greenStatus', () => {
    const blocklet = {
      children: [
        {
          ...child,
          status: 6,
          greenStatus: 8,
        },
      ],
    };

    const res = getMountPoints(blocklet).filter((item) => item.title);

    expect(res).toEqual([
      {
        title: 'Discuss Kit',
        name: 'did-comments',
        did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu',
        version: '2.4.115',
        status: 'running',
        mountPoint: '/docs',
        components: [],
        capabilities: {},
      },
    ]);
  });

  it('greenStatus is running and status is not running', () => {
    const blocklet = {
      children: [
        {
          ...child,
          status: 8,
          greenStatus: 6,
        },
      ],
    };

    const res = getMountPoints(blocklet).filter((item) => item.title);

    expect(res).toEqual([
      {
        title: 'Discuss Kit',
        name: 'did-comments',
        did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu',
        version: '2.4.115',
        status: 'running',
        mountPoint: '/docs',
        components: [],
        capabilities: {},
      },
    ]);
  });

  it('only has status stopped', () => {
    const blocklet = {
      children: [
        {
          ...child,
          status: 8,
        },
      ],
    };

    const res = getMountPoints(blocklet).filter((item) => item.title);

    expect(res).toEqual([
      {
        title: 'Discuss Kit',
        name: 'did-comments',
        did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu',
        version: '2.4.115',
        status: 'stopped',
        mountPoint: '/docs',
        components: [],
        capabilities: {},
      },
    ]);
  });

  it('only has status running', () => {
    const blocklet = {
      children: [
        {
          ...child,
          status: 6,
        },
      ],
    };

    const res = getMountPoints(blocklet).filter((item) => item.title);

    expect(res).toEqual([
      {
        title: 'Discuss Kit',
        name: 'did-comments',
        did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu',
        version: '2.4.115',
        status: 'running',
        mountPoint: '/docs',
        components: [],
        capabilities: {},
      },
    ]);
  });

  it('only has status installing and greenStatus is stopped', () => {
    const blocklet = {
      children: [
        {
          ...child,
          status: 3,
          greenStatus: 8,
        },
      ],
    };

    const res = getMountPoints(blocklet).filter((item) => item.title);

    expect(res).toEqual([
      {
        title: 'Discuss Kit',
        name: 'did-comments',
        did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu',
        version: '2.4.115',
        status: 'installing',
        mountPoint: '/docs',
        components: [],
        capabilities: {},
      },
    ] as unknown as typeof res);
  });
});
