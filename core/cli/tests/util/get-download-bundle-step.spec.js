const { test, expect } = require('bun:test');
const getDownloadBundleStep = require('../../lib/util/get-download-bundle-step');

test('getDownloadBundleStep', () => {
  const progresses = [
    {
      status: 'downloading',
      total: 123,
      current: 33,
      component: { title: 'Component1' },
    },
    {
      status: 'extracting',
      name: 'blocklet.zip',
      component: { title: 'Component2' },
    },
  ];

  expect(getDownloadBundleStep(progresses)).toBe('Downloading Component1: 26%\nExtracting Component2: blocklet.zip...');

  expect(getDownloadBundleStep(progresses, { paddingStart: '  ' })).toBe(
    'Downloading Component1: 26%\n  Extracting Component2: blocklet.zip...'
  );
});
