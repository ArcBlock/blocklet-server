const { it, expect, describe } = require('bun:test');
const { validateWebhook } = require('../../lib/validators/webhook');

describe('validator.webhook', () => {
  it('should throw on invalid input', () => {
    const data = {
      type: 'do-not-exist',
      params: [
        {
          name: '',
          value: '',
        },
      ],
    };
    expect(() => validateWebhook(data)).toThrow();
  });

  it('should throw on invalid slack webhook', () => {
    const data = {
      type: 'slack',
      params: [
        {
          name: 'url',
          value: 'https://www.arcblock.io',
        },
      ],
    };
    expect(() => validateWebhook(data)).toThrow();
  });

  it('should throw on invalid api webhook', () => {
    const data = {
      type: 'api',
      params: [
        {
          name: 'url',
          value: 'ftp://www.arcblock.io',
        },
      ],
    };
    expect(() => validateWebhook(data)).toThrow();
  });

  it('should throw on unknown param', () => {
    const data = {
      type: 'api',
      params: [
        {
          name: 'do-not-exist',
          value: 'ftp://www.arcblock.io',
        },
      ],
    };
    expect(() => validateWebhook(data)).toThrow();
  });

  it('should not throw on valid slack webhook', () => {
    const data = {
      type: 'slack',
      params: [
        {
          name: 'url',
          value: 'https://hooks.slack.com/',
        },
      ],
      createdAt: Date.now(),
    };
    expect(validateWebhook(data)).toBeTruthy();
  });

  it('should not throw on valid api webhook', () => {
    const data = {
      type: 'api',
      params: [
        {
          name: 'url',
          value: 'https://hooks.slack.com/',
        },
      ],
      createdAt: Date.now(),
    };
    expect(validateWebhook(data)).toBeTruthy();
  });
});
