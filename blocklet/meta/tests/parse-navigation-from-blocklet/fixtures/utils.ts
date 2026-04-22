export function fakeMeta() {
  return {
    did: 'z8iZqvhASRwy4yND1AXodPUJGmgoRffYsvfQj',
    bundleDid: 'z8iZjejYpy7TeJbTq6oXLbVgXemAMbpqwM17Q',
    bundleName: 'minimalist-html-demo',
    name: 'minimalist-html-demo',
    title: 'Simple HTML Demo',
    version: '1.0.15',
    capabilities: {},
  };
}

export function fakeChildBlocklet() {
  return {
    mountPoint: '/minimalist-html-demo',
    children: [] as any[],
    meta: fakeMeta(),
    dynamic: true,
  };
}
export function fakeChildBlocklets() {
  return [fakeChildBlocklet()];
}

export function fakeNavigation() {
  return {
    title: 'Component Demo',
    component: 'component-demo-1',
    id: 'z8iZsvZpMrfEwwbMM2BZxsZGbo4zmhbA7G3FV',
    link: '/',
    from: 'yaml',
    visible: true,
    // section: 'header',
  };
}

export function fakeNavigations() {
  return [fakeNavigation()];
}

export function fakeBlocklet() {
  return {
    appDid: 'zNKqRZMZpX49Ct2byuFJKX2H4siZARnfQLiy',
    dynamic: null as any,
    mountPoint: null as any,
    children: fakeChildBlocklets(),
    meta: fakeMeta(),
    settings: {
      navigations: fakeNavigations(),
    },
  };
}
