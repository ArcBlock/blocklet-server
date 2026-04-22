const { test, expect } = require('bun:test');
const { ensureServiceNavigation, ensureSessionManagerNavigation } = require('../../../api/util/navigation');

test('ensureServiceNavigation', () => {
  const navigation = ensureServiceNavigation([]);
  expect(navigation.length).toBe(2);
});

test('ensureSessionManagerNavigation', () => {
  const nav1 = [];
  ensureSessionManagerNavigation(nav1);
  expect(nav1.length).toBe(1);
  expect(nav1[0].title.en).toBe('Dashboard');
  expect(nav1[0].section).toEqual(['sessionManager']);

  // do not fill nav already exist in sessionManager
  const nav2 = [{ title: 'a', section: ['sessionManager'] }];
  ensureSessionManagerNavigation(nav2);
  expect(nav2.length).toBe(1);
  expect(nav2[0].title).toBe('a');
});
