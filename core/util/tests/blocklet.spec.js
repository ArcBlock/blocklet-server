const { test, expect, describe } = require('bun:test');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { joinURL } = require('ufo');

const { getComponentApiKey, getBlockletLogos, getLogoHash } = require('../lib/blocklet');

describe('blocklet', () => {
  test('getComponentApiKey', () => {
    const res1 = getComponentApiKey({
      serverSk: '123',
      app: { meta: { did: 'z2qa4ZCQ8HTMhYwmyWvR9knrBap1Cj1uEJBVG' } },
      component: { meta: { did: 'z2qa6sDtUrAVS2ZkwDbQQbr9F4jb3sMpWfNhF' }, installedAt: '2023-08-11T07:03:20.773Z' },
    });
    expect(res1).toEqual('/P8u/ALyof+EbvVhKN3r+S47hHUHdv/1cjFxRHTwS9I=');

    // Date object should produce the same hash as ISO string (fix for children table split)
    const res1WithDate = getComponentApiKey({
      serverSk: '123',
      app: { meta: { did: 'z2qa4ZCQ8HTMhYwmyWvR9knrBap1Cj1uEJBVG' } },
      component: {
        meta: { did: 'z2qa6sDtUrAVS2ZkwDbQQbr9F4jb3sMpWfNhF' },
        installedAt: new Date('2023-08-11T07:03:20.773Z'),
      },
    });
    expect(res1WithDate).toEqual(res1);

    const res2 = getComponentApiKey({
      serverSk: '123',
      app: { meta: { did: 'z2qa4ZCQ8HTMhYwmyWvR9knrBap1Cj1uEJBVG' } },
      component: { meta: { did: 'z2qa6sDtUrAVS2ZkwDbQQbr9F4jb3sMpWfNhF' } },
    });

    const res3 = getComponentApiKey({
      serverSk: '123',
      app: { meta: { did: 'z2qa4ZCQ8HTMhYwmyWvR9knrBap1Cj1uEJBVG' } },
      component: { meta: { did: 'z2qa6sDtUrAVS2ZkwDbQQbr9F4jb3sMpWfNhF' }, installedAt: 'undefined' },
    });
    expect(res3 === res2);

    expect(() => getComponentApiKey()).toThrow('serverSk should not be empty');
    expect(() => getComponentApiKey({ serverSk: '123' })).toThrow('app.meta.did should not be empty');
    expect(() => getComponentApiKey({ serverSk: '123', app: { meta: { did: '123' } } })).toThrow(
      'component.meta.did should not be empty'
    );
  });

  describe('getBlockletLogos', () => {
    describe('appLogo', () => {
      test('appLogo exists and is URL: should return appLogo includes imageFilter param', () => {
        const logoURL = 'https://www.polunzh.dev/.well-known/service/blocklet/logo';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE, value: logoURL }],
        };

        const { appLogo } = getBlockletLogos(blocklet);
        expect(appLogo).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80`);
      });

      test('appLogo exists and is not URL: should return appLogo includes imageFilter param', () => {
        const logoURL = '/.well-known/service/blocklet/logo';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE, value: logoURL }],
        };

        const { appLogo } = getBlockletLogos(blocklet);
        expect(appLogo).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80&hash=${getLogoHash(logoURL)}`);
      });

      test('appLogo does not exist: should return default path', () => {
        const blocklet = {};
        const { appLogo } = getBlockletLogos(blocklet);

        expect(appLogo).toBe(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo?imageFilter=convert&f=png&h=80'));
      });
    });

    describe('appLogoRect', () => {
      test('appLogoRect exists and is URL: should return appLogo includes imageFilter param', () => {
        const logoURL = 'https://www.polunzh.dev/.well-known/service/blocklet/logo-test-rect';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT, value: logoURL }],
        };

        const { appLogoRect } = getBlockletLogos(blocklet);
        expect(appLogoRect).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80`);
      });

      test('appLogoRect exists and is not URL: should return appLogo includes imageFilter param', () => {
        const logoURL = '/.well-known/service/blocklet/logo-rect';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT, value: logoURL }],
        };

        const { appLogoRect } = getBlockletLogos(blocklet);
        expect(appLogoRect).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80&hash=${getLogoHash(logoURL)}`);
      });

      test('appLogoRect does not exist: should return empty string', () => {
        const blocklet = {};
        const { appLogoRect } = getBlockletLogos(blocklet);

        expect(appLogoRect).toBe('');
      });
    });

    describe('appLogoDark', () => {
      test('appLogoDark exists and is URL: should return appLogoDark includes imageFilter param', () => {
        const logoURL = 'https://www.polunzh.dev/.well-known/service/blocklet/logo-dark';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE_DARK, value: logoURL }],
        };

        const { appLogoDark } = getBlockletLogos(blocklet);
        expect(appLogoDark).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80`);
      });

      test('appLogoDark exists and is not URL: should return appLogoDark includes imageFilter param', () => {
        const logoURL = '/.well-known/service/blocklet/logo-dark';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE_DARK, value: logoURL }],
        };

        const { appLogoDark } = getBlockletLogos(blocklet);
        expect(appLogoDark).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80&hash=${getLogoHash(logoURL)}`);
      });

      test('appLogoDark does not exist: should return empty string', () => {
        const blocklet = {};
        const { appLogoDark } = getBlockletLogos(blocklet);

        expect(appLogoDark).toBe('');
      });
    });

    describe('appLogoRectDark', () => {
      test('appLogoRectDark exists and is URL: should return appLogoRectDark includes imageFilter param', () => {
        const logoURL = 'https://www.polunzh.dev/.well-known/service/blocklet/logo-test-rect-dark';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT_DARK, value: logoURL }],
        };

        const { appLogoRectDark } = getBlockletLogos(blocklet);
        expect(appLogoRectDark).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80`);
      });

      test('appLogoRectDark exists and is not URL: should return appLogoRectDark includes imageFilter param', () => {
        const logoURL = '/.well-known/service/blocklet/logo-rect-dark';
        const blocklet = {
          environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT_DARK, value: logoURL }],
        };

        const { appLogoRectDark } = getBlockletLogos(blocklet);
        expect(appLogoRectDark).toEqual(`${logoURL}?imageFilter=convert&f=png&h=80&hash=${getLogoHash(logoURL)}`);
      });

      test('appLogoRectDark does not exist: should return empty string', () => {
        const blocklet = {};
        const { appLogoRectDark } = getBlockletLogos(blocklet);

        expect(appLogoRectDark).toBe('');
      });
    });
  });
});
