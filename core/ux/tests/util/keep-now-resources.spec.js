import { describe, expect, test } from 'bun:test';
import keepNowResources from '../../src/blocklet/publish/create-release/keep-now-resources';

describe('keepNowResources', () => {
  test('real data need success', () => {
    const trees = [
      {
        id: 'application/458390527952289792-error',
        name: 'Application',
        disabled: false,
        dependentComponents: [],
      },
      {
        id: 'other/458390527952289792',
        name: 'Other',
        children: [
          {
            id: 'llm-adapter/458390527952289792',
            name: 'LLM Adapter',
            children: [
              {
                id: 'llm-adapter/458390527952289792/20240501103625-CTSYbv',
                name: 'App',
                dependentComponents: [],
                parent: 'llm-adapter/458390527952289792',
              },
              {
                id: 'llm-adapter/458390527952289792/20240501153219-tp9OdP',
                name: 'Email Generator',
                dependentComponents: [],
                parent: 'llm-adapter/458390527952289792',
              },
            ],
            dependentComponents: [],
            parent: 'other/458390527952289792',
          },
          {
            id: 'aigc-adapter/458390527952289792',
            name: 'AIGC Adapter',
            children: [
              {
                id: 'aigc-adapter/458390527952289792/20240501103625-CTSYbv',
                name: 'App',
                dependentComponents: [],
                parent: 'aigc-adapter/458390527952289792',
              },
              {
                id: 'aigc-adapter/458390527952289792/20240501153219-tp9OdP',
                name: 'Email Generator',
                dependentComponents: [],
                parent: 'aigc-adapter/458390527952289792',
              },
            ],
            dependentComponents: [],
            parent: 'other/458390527952289792',
          },
          {
            id: 'template/458390527952289792',
            name: 'Template',
            dependentComponents: [],
            parent: 'other/458390527952289792',
          },
          {
            id: 'example/458390527952289792',
            name: 'Example',
            dependentComponents: [],
            parent: 'other/458390527952289792',
          },
          {
            id: 'knowledge/458390527952289792',
            name: 'Knowledge',
            children: [],
            dependentComponents: [],
            parent: 'other/458390527952289792',
          },
        ],
      },
    ];

    const list = [
      'tool/458390527952289792',
      'tool/458390527952289792/20240501103625-CTSYbv',
      'tool/458390527952289792/20240501153219-tp9OdP',
      'application/458390527952289792',
      'llm-adapter/458390527952289792',
      'llm-adapter/458390527952289792/20240501103625-CTSYbv',
      'llm-adapter/458390527952289792/20240501153219-tp9OdP',
    ];

    const resources = keepNowResources(trees, list);
    expect(resources).toEqual([
      'llm-adapter/458390527952289792',
      'llm-adapter/458390527952289792/20240501103625-CTSYbv',
      'llm-adapter/458390527952289792/20240501153219-tp9OdP',
    ]);
  });

  test('remove top level tree', () => {
    const trees = [
      {
        id: 'other/458390527952289792',
        name: 'Other',
        children: [
          {
            id: 'llm-adapter/458390527952289792',
            name: 'LLM Adapter',
            children: [
              {
                id: 'llm-adapter/458390527952289792/20240501103625-CTSYbv',
                name: 'App',
                dependentComponents: [],
                parent: 'llm-adapter/458390527952289792',
              },
            ],
            dependentComponents: [],
            parent: 'other/458390527952289792',
          },
          {
            id: 'aigc-adapter/458390527952289792',
            name: 'AIGC Adapter',
            children: [
              {
                id: 'aigc-adapter/458390527952289792/20240501103625-CTSYbv',
                name: 'App',
                dependentComponents: [],
                parent: 'aigc-adapter/458390527952289792',
              },
              {
                id: 'aigc-adapter/458390527952289792/20240501153219-tp9OdP',
                name: 'Email Generator',
                dependentComponents: [],
                parent: 'aigc-adapter/458390527952289792',
              },
            ],
            dependentComponents: [],
            parent: 'other/458390527952289792',
          },
        ],
      },
    ];

    const list = [
      'tool/458390527952289792',
      'tool/458390527952289792/20240501103625-CTSYbv',
      'tool/458390527952289792/20240501153219-tp9OdP',
      'application/458390527952289792',
      'llm-adapter/458390527952289792',
      'llm-adapter/458390527952289792/20240501103625-CTSYbv',
      'llm-adapter/458390527952289792/20240501153219-tp9OdP',
    ];

    const resources = keepNowResources(trees, list);
    expect(resources).toEqual([
      'llm-adapter/458390527952289792',
      'llm-adapter/458390527952289792/20240501103625-CTSYbv',
    ]);
  });

  test('no match trees', () => {
    const trees = [];

    const list = [
      'tool/458390527952289792',
      'tool/458390527952289792/20240501103625-CTSYbv',
      'tool/458390527952289792/20240501153219-tp9OdP',
      'application/458390527952289792',
      'llm-adapter/458390527952289792',
      'llm-adapter/458390527952289792/20240501103625-CTSYbv',
      'llm-adapter/458390527952289792/20240501153219-tp9OdP',
    ];

    const resources = keepNowResources(trees, list);
    expect(resources).toEqual([]);
  });

  test('empty trees', () => {
    const trees = [
      {
        id: 'application/458390527952289792',
        name: 'Application',
        disabled: false,
        dependentComponents: [],
      },
    ];

    const list = [
      'tool/458390527952289792',
      'tool/458390527952289792/20240501103625-CTSYbv',
      'tool/458390527952289792/20240501153219-tp9OdP',
      // 'application/458390527952289792',
      'llm-adapter/458390527952289792',
      'llm-adapter/458390527952289792/20240501103625-CTSYbv',
      'llm-adapter/458390527952289792/20240501153219-tp9OdP',
    ];

    const resources = keepNowResources(trees, list);
    expect(resources).toEqual([]);
  });

  test('empty list', () => {
    const trees = [
      {
        id: 'application/458390527952289792',
        name: 'Application',
        disabled: false,
        dependentComponents: [],
      },
    ];

    const list = [];

    const resources = keepNowResources(trees, list);
    expect(resources).toEqual([]);
  });

  test('defense null', () => {
    const trees = null;
    const list = null;
    const resources = keepNowResources(trees, list);
    expect(resources).toEqual([]);
  });

  test('defense void', () => {
    const trees = undefined;
    const list = undefined;
    const resources = keepNowResources(trees, list);
    expect(resources).toEqual([]);
  });
});
