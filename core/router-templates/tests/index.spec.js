/* eslint-disable no-console */
const { test, expect, describe } = require('bun:test');
const { template404, template502, template5xx, templateCommon, templateWelcome } = require('../lib/index');
const { getBlockletMaintenanceTemplate } = require('../lib/blocklet-maintenance');
const { getBlockletNotRunningTemplate } = require('../lib/blocklet-not-running');
const templateBlocklet403 = require('../lib/blocklet-403');
const templateBlocklet404 = require('../lib/blocklet-404');

describe('router-templates', () => {
  test('should be a function', () => {
    expect(typeof template404).toEqual('function');
    expect(typeof template502).toEqual('function');
    expect(typeof template5xx).toEqual('function');
    expect(typeof templateCommon).toEqual('function');
    expect(typeof getBlockletMaintenanceTemplate).toEqual('function');
    expect(typeof getBlockletNotRunningTemplate).toEqual('function');
    expect(typeof templateWelcome).toEqual('function');
    expect(typeof templateBlocklet403).toEqual('function');
  });

  test('should work as expected', () => {
    expect(getBlockletMaintenanceTemplate()).toMatch('Something Awesome is Coming!');
    expect(getBlockletMaintenanceTemplate()).toMatch('<img src="/.well-known/service/blocklet/logo?version=');

    expect(getBlockletNotRunningTemplate()).toMatch('not running');
    expect(getBlockletNotRunningTemplate()).toMatch('<img src="/.well-known/service/blocklet/logo?version=');

    expect(template404()).toMatch('404');
    expect(template502()).toMatch('502');
    expect(template5xx()).toMatch('Something went wrong');
    expect(templateWelcome()).toMatch('Your Blocklet Server is up and running!');

    expect(templateBlocklet403()).toMatch('403');
    expect(templateBlocklet403()).toMatch('<img src="/.well-known/service/blocklet/logo?version=');

    expect(templateBlocklet404()).toMatch('404');
    expect(templateBlocklet404()).toMatch('<img src="/.well-known/service/blocklet/logo?version=');
  });
});
