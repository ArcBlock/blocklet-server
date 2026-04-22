import cloneDeep from 'lodash/cloneDeep';
import { describe, expect, test } from 'bun:test';
import { tokenSchema, notificationSchema, messageSchema, optionSchema } from '../../src/validators/notification';

const validDid = 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat';

const mergeItem = (a: any, b: any, key = 'attachments') => {
  const ret = cloneDeep(a);
  ret[key][0].data = { ...ret[key][0].data, ...b };
  Object.keys(ret[key][0].data).forEach((x) => {
    if (ret[key][0].data[x] === undefined) {
      delete ret[key][0].data[x];
    }
  });
  return ret;
};

describe('NotificationSchema', () => {
  test('should allow empty token address', () => {
    expect(
      tokenSchema.validate({
        address: '',
        amount: '123',
        symbol: 'TBA',
        senderDid: 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat',
        chainHost: 'https://beta.abtnetwork.io/api',
        decimal: 18,
      })
    ).toBeTruthy();
  });

  test('should allow valid token address', () => {
    expect(
      tokenSchema.validate({
        address: 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat',
        amount: '123',
        symbol: 'TBA',
        senderDid: 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat',
        chainHost: 'https://beta.abtnetwork.io/api',
        decimal: 18,
      })
    ).toBeTruthy();
  });

  test('should throw on invalid token address', () => {
    const { error } = tokenSchema.validate({
      address: '123',
      amount: '123',
      symbol: 'TBA',
      senderDid: 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat',
      chainHost: 'https://beta.abtnetwork.io/api',
      decimal: 18,
    });
    expect(error).toBeTruthy();
  });

  test('should throw on invalid senderDid address', () => {
    const { error } = tokenSchema.validate({
      address: 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat',
      amount: '123',
      symbol: 'TBA',
      senderDid: '123',
      chainHost: 'https://beta.abtnetwork.io/api',
      decimal: 18,
    });
    expect(error).toBeTruthy();
  });

  test('should allow valid feed type', () => {
    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: 'xxx',
        data: {},
      }).error
    ).toBeFalsy();

    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: 'xxx',
        data: { x: 'xxx' },
      }).error
    ).toBeFalsy();

    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: 'xxx',
        data: { x: 'xxx', y: { z: 'zzz' } },
      }).error
    ).toBeFalsy();
  });

  test('should throw on invalid feed type', () => {
    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: '',
        data: {},
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: 'xxx',
        data: null,
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: 'xxx',
        data: 'string',
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: 'xxx',
        data: [],
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'feed',
        feedType: 'xxx',
        data: () => {},
      }).error
    ).toBeTruthy();
  });

  test('should allow valid passthrough type', () => {
    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: 'xxx',
        data: {},
      }).error
    ).toBeFalsy();

    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: 'xxx',
        data: { x: 'xxx' },
      }).error
    ).toBeFalsy();

    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: 'xxx',
        data: { x: 'xxx', y: { z: 'zzz' } },
      }).error
    ).toBeFalsy();
  });

  test('should throw on invalid passthrough type', () => {
    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: '',
        data: {},
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: 'xxx',
        data: null,
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: 'xxx',
        data: 'string',
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: 'xxx',
        data: [],
      }).error
    ).toBeTruthy();

    expect(
      notificationSchema.validate({
        type: 'passthrough',
        passthroughType: 'xxx',
        data: () => {},
      }).error
    ).toBeTruthy();
  });

  test('should allow valid message type', () => {
    expect(
      messageSchema.validate({
        id: 'xxx',
        createdAt: new Date(),
        type: 'any sting',
        receiver: {
          did: 'zNKaT2cjMMW4Js3hnBWUKPcdboQqrPUTWRat',
        },
        otherProp: 'any',
      }).error
    ).toBeFalsy();

    expect(
      optionSchema.validate({
        unknownProp: '',
      }).error
    ).toBeFalsy();

    expect(
      optionSchema.validate({
        unknownProp: 'xxx',
      }).error
    ).toBeFalsy();
  });

  test('should options schema work as expected', () => {
    expect(
      optionSchema.validate({
        keepForOfflineUser: 'true',
      }).error
    ).toBeFalsy();
    expect(optionSchema.validate({}).error).toBeFalsy();
    expect(optionSchema.validate(undefined).error).toBeFalsy();

    expect(optionSchema.validate({ keepForOfflineUser: 'string' }).error).toBeTruthy();
    expect(optionSchema.validate(null).error).toBeTruthy();
  });

  test('should allow severity', () => {
    ['normal', 'error', 'warning', 'success'].forEach((severity) => {
      expect(
        notificationSchema.validate({
          type: 'notification',
          severity,
        }).error
      ).toBeFalsy();
    });

    expect(
      notificationSchema.validate({
        type: 'notification',
        severity: 'unknown',
      }).error
    ).toBeTruthy();
  });

  ['attachments', 'blocks'].forEach((key) => {
    describe(key, () => {
      test('should allow text item', () => {
        const data = {
          type: 'notification',
          [key]: [
            {
              type: 'text',
              data: {
                type: 'any',
                text: 'hello world',
                color: 'any',
                size: 'small',
              },
            },
          ],
        };

        expect(notificationSchema.validate(data).error).toBeFalsy();
        expect(
          notificationSchema.validate(mergeItem(data, { color: undefined, size: undefined }, key)).error
        ).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { color: '' }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { color: undefined }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { size: undefined }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { size: 'not valid' }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { text: '' }, key)).error).toBeTruthy(); // required
        expect(notificationSchema.validate(mergeItem(data, { type: '' }, key)).error).toBeTruthy(); // required
      });

      test('should allow image item', () => {
        const data = {
          type: 'notification',
          [key]: [
            {
              type: 'image',
              data: {
                url: 'https://img',
                alt: 'any',
              },
            },
          ],
        };

        expect(notificationSchema.validate(data).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { alt: '' }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { alt: undefined }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { img: '' }, key)).error).toBeTruthy(); // required
        expect(notificationSchema.validate(mergeItem(data, { img: 'not valid' }, key)).error).toBeTruthy();
      });

      test('should allow transaction item', () => {
        const data = {
          type: 'notification',
          [key]: [
            {
              type: 'transaction',
              data: {
                hash: 'any',
                chainId: 'any',
              },
            },
          ],
        };

        expect(notificationSchema.validate(data).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { hash: '' }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { hash: undefined }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { chainId: '' }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { chainId: undefined }, key)).error).toBeTruthy();
      });

      test('should allow dapp item', () => {
        const data = {
          type: 'notification',
          [key]: [
            {
              type: 'dapp',
              data: {
                url: 'https://a',
                appDID: validDid,
                logo: 'https://logo',
                title: 'any',
                desc: 'any',
              },
            },
          ],
        };

        expect(notificationSchema.validate(data).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { url: 'https://b' }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { url: 'not valid' }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { appDID: 'not valid' }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { logo: 'not valid' }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { title: '' }, key)).error).toBeTruthy(); // title is required
        expect(notificationSchema.validate(mergeItem(data, { desc: '' }, key)).error).toBeFalsy(); // desc is optional
        expect(notificationSchema.validate(mergeItem(data, { desc: undefined }, key)).error).toBeFalsy(); // desc is optional
      });

      test('should allow divider item', () => {
        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'divider',
              },
            ],
          }).error
        ).toBeFalsy();

        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'divider',
                data: {},
              },
            ],
          }).error
        ).toBeFalsy();

        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'divider',
                data: {
                  shouldNotHaveProp: '',
                },
              },
            ],
          }).error
        ).toBeTruthy();

        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'divider',
                data: 'should not be string',
              },
            ],
          }).error
        ).toBeTruthy();
      });

      test('should allow link item', () => {
        const data = {
          type: 'notification',
          [key]: [
            {
              type: 'link',
              data: {
                url: 'http://link',
                title: 'any',
                description: 'any',
                image: 'http://img',
              },
            },
          ],
        };

        expect(notificationSchema.validate(data).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { url: 'https://linb2' }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { url: 'not valid' }, key)).error).toBeTruthy();
        expect(notificationSchema.validate(mergeItem(data, { description: '' }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { title: '' }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { image: undefined }, key)).error).toBeFalsy();
        expect(notificationSchema.validate(mergeItem(data, { image: 'not valid' }, key)).error).toBeTruthy();
      });

      test('should allow section item', () => {
        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'section',
                // @ts-ignore
                fields: [],
              },
            ],
          }).error
        ).toBeFalsy();

        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'section',
                fields: [
                  {
                    type: 'text',
                    data: {
                      type: 'any',
                      text: 'hello world',
                    },
                  },
                  {
                    type: 'text',
                    data: {
                      type: 'any',
                      text: 'hello world 2',
                    },
                  },
                ],
              },
            ],
          }).error
        ).toBeFalsy();

        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'section',
                fields: [
                  {
                    type: 'text',
                    data: {
                      invalidProp: 'invalid value',
                    },
                  },
                ],
              },
            ],
          }).error
        ).toBeTruthy();

        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [
              {
                type: 'section',
                fields: [
                  {
                    type: 'type should be only text',
                  },
                ],
              },
            ],
          }).error
        ).toBeTruthy();
      });

      test('should allow empty array', () => {
        expect(
          notificationSchema.validate({
            type: 'notification',
            [key]: [],
          }).error
        ).toBeFalsy();
      });
    });
  });

  test('should return readable error message', () => {
    expect(
      notificationSchema.validate({
        type: 'notification',
        attachments: [
          {
            type: 'divider',
            data: {
              shouldNotHaveProp: '',
            },
          },
        ],
      }).error?.message
    ).toMatch('shouldNotHaveProp" is not allowed');

    expect(
      notificationSchema.validate({
        type: 'notification',
        attachments: [
          {
            type: 'divider',
            data: 'should not be string',
          },
        ],
      }).error?.message
    ).toMatch('data" must be of type object');

    expect(notificationSchema.validate({ attachments: [{ type: 'unknown' }] }).error?.message).toMatch(
      'type" must be one of [asset, vc, token, text, image, divider, transaction, dapp, link, section]'
    );

    expect(
      notificationSchema.validate({ attachments: [{ type: 'link', data: { url: 'not valid' } }] }).error?.message
    ).toMatch('must be a valid uri');
  });
});
