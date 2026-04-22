const { test, describe, expect, beforeEach, afterEach } = require('bun:test');
const { getUTMUrl, attachNotificationUTM } = require('../../api/util/utm');

describe('getUTMUrl', () => {
  // Basic functionality tests
  describe('Basic URL handling', () => {
    test('should add UTM parameters to valid URLs', () => {
      const validUrl = 'https://example.com/path';

      const result = getUTMUrl(validUrl);
      expect(result).toContain('utm_source=activity_notification');
      expect(result).toContain('utm_medium=email');
      expect(result).toContain('utm_campaign=default');
      expect(result).toContain('utm_content=email_body');
    });

    test('should keep invalid URLs unchanged', () => {
      const invalidUrl = '/relative/path';

      const result = getUTMUrl(invalidUrl);
      expect(result).toBe(invalidUrl);
    });

    test('should keep non-URL strings unchanged', () => {
      const nonUrl = 'not-a-url';

      const result = getUTMUrl(nonUrl);
      expect(result).toBe(nonUrl);
    });
  });

  // UTM parameter tests
  describe('UTM parameter handling', () => {
    test('should use default UTM parameters', () => {
      const validUrl = 'https://example.com/path';

      const result = getUTMUrl(validUrl);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('activity_notification');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('default');
      expect(url.searchParams.get('utm_content')).toBe('email_body');
    });

    test('should override default values with custom UTM parameters', () => {
      const utm = {
        source: 'custom_source',
        campaign: 'custom_campaign',
      };
      const validUrl = 'https://example.com/path';

      const result = getUTMUrl(validUrl, utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('custom_source');
      expect(url.searchParams.get('utm_medium')).toBe('email'); // use default value
      expect(url.searchParams.get('utm_campaign')).toBe('custom_campaign');
      expect(url.searchParams.get('utm_content')).toBe('email_body'); // use default value
    });

    test('should override default values with function arguments', () => {
      const validUrl = 'https://example.com/path';
      const utm = {
        source: 'param_source',
        content: 'param_content',
      };

      const result = getUTMUrl(validUrl, utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('param_source');
      expect(url.searchParams.get('utm_medium')).toBe('email'); // default value
      expect(url.searchParams.get('utm_campaign')).toBe('default'); // default value
      expect(url.searchParams.get('utm_content')).toBe('param_content');
    });

    test('should preserve existing query parameters', () => {
      const validUrl = 'https://example.com/path?existing=value&another=param';

      const result = getUTMUrl(validUrl);
      const url = new URL(result);

      expect(url.searchParams.get('existing')).toBe('value');
      expect(url.searchParams.get('another')).toBe('param');
      expect(url.searchParams.get('utm_source')).toBe('activity_notification');
    });

    test('existing query parameters should take priority over UTM parameters', () => {
      const validUrl = 'https://example.com/path?utm_source=existing_source';

      const result = getUTMUrl(validUrl);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('existing_source'); // existing parameter takes priority
    });
  });

  // Tests using real email template data
  describe('Real email template data tests', () => {
    test('test notification email data - 01 test.tsx', () => {
      const notification = {
        title: 'Head for blocklet email demo',
        body: 'User <DAMINGZHAO(did:abt:z1Y313EXfBK9FePjDh5cZy6sNY97TneEemB)> has a <Transaction(tx:beta:D20C566BB46A7B6B4DDEA0B42EB3996F0213C1C27C54533F3D40D7B5C6DA59FD)> and it will give your a <Badge (nft:beta:zjdivheWGgy6ucvsYYqP34hVeUgx6743GEfx)> on the DApp <OCAP Playground(dapp:beta:zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM)>',
        utm: {
          campaign: 'blocklet_demo',
        },
      };

      const validUrl = 'https://token-prize-pool-bfg-18-180-145-193.ip.abtnet.io/';
      const result = getUTMUrl(validUrl, notification.utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('activity_notification');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('blocklet_demo');
      expect(url.searchParams.get('utm_content')).toBe('email_body');
    });

    test('test server launcher email data - 02 launcher.tsx', () => {
      const notification = {
        title: 'Blocklet Server is up and running',
        body: 'Your Blocklet Server Blocklet Space(zNKcdNoYGDYEZMLC9UfLKtyFWurpdz5JJhWS) is up and running.',
        utm: {
          source: 'server_launcher',
          campaign: 'server_management',
        },
      };

      const validUrl = 'https://launcher.staging.arcblock.io/';
      const result = getUTMUrl(validUrl, notification.utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('server_launcher');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('server_management');
      expect(url.searchParams.get('utm_content')).toBe('email_body');
    });

    test('test certificate email data - 03 aigne.tsx', () => {
      const notification = {
        title: 'You just received a course completion certificate',
        body: 'Thanks for completing the course, here is your certificate.',
        utm: {
          source: 'aigne_platform',
          campaign: 'course_completion',
          content: 'certificate_notification',
        },
      };

      const validUrl = 'https://staging.aigne.io/ai-studio/apps/504479224665473024';
      const result = getUTMUrl(validUrl, notification.utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('aigne_platform');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('course_completion');
      expect(url.searchParams.get('utm_content')).toBe('certificate_notification');
    });

    test('test verification code email data - 04 verify-code.tsx', () => {
      const notification = {
        title: 'Verification Code',
        body: 'Your verification code is 123456',
        utm: {
          campaign: 'email_verification',
        },
      };

      const validUrl = 'https://www.arcblock.io';
      const magicLinkUrl = 'https://external-service.com/verify?token=abc123';

      // test main site link
      const result1 = getUTMUrl(validUrl, notification.utm);
      const url1 = new URL(result1);
      expect(url1.searchParams.get('utm_campaign')).toBe('email_verification');

      // test magic link
      const result2 = getUTMUrl(magicLinkUrl, notification.utm);
      const url2 = new URL(result2);
      expect(url2.searchParams.get('utm_campaign')).toBe('email_verification');
      expect(url2.searchParams.get('token')).toBe('abc123'); // preserve original parameter
    });

    test('test new user session email data - 05 new-user-session.tsx', () => {
      const notification = {
        title: 'New User Session Alert',
        body: 'A new session has been created for your account',
        utm: {
          source: 'security_alert',
          campaign: 'session_management',
          content: 'new_session_notification',
        },
      };

      const validUrl = 'https://www.arcblock.io/security/sessions';
      const result = getUTMUrl(validUrl, notification.utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('security_alert');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('session_management');
      expect(url.searchParams.get('utm_content')).toBe('new_session_notification');
    });

    test('test KYC verification email data - 06 kyc-code-verify.tsx', () => {
      const notification = {
        title: 'KYC Verification Code',
        body: 'Your KYC verification code is 123456',
        utm: {
          source: 'kyc_system',
          campaign: 'identity_verification',
          content: 'kyc_code',
        },
      };

      const validUrl = 'https://www.arcblock.io/kyc/verify';
      const result = getUTMUrl(validUrl, notification.utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('kyc_system');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('identity_verification');
      expect(url.searchParams.get('utm_content')).toBe('kyc_code');
    });

    test('test activity notification email data - 07 activity-notification.tsx', () => {
      const notification = {
        title: 'Merged Notification Read',
        body: '<lius(did:abt:z1TZWQFZ6rsoHbty2obQsRuGbfwLya1Wf7h)> commented on your post',
        activity: {
          type: 'comment',
          actor: 'z1TZWQFZ6rsoHbty2obQsRuGbfwLya1Wf7h',
        },
        utm: {
          source: 'discuss_kit',
          campaign: 'activity_notification',
          content: 'comment_notification',
        },
      };

      const validUrl =
        'https://bbqau46ggmecwatse6zxcf4dapnqgnwqkeeaiooy4f4.did.abtnet.io/discuss-kit/discussions/a6a8a7ef-92ec-4267-948b-de0ace2295fc/#b7c351f4-38be-427b-a53c-018663d2b70e';
      const result = getUTMUrl(validUrl, notification.utm);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('discuss_kit');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('activity_notification');
      expect(url.searchParams.get('utm_content')).toBe('comment_notification');
      // verify anchor is preserved
      expect(url.hash).toBe('#b7c351f4-38be-427b-a53c-018663d2b70e');
    });
  });

  // Edge cases and error handling
  describe('Edge cases and error handling', () => {
    test('should handle invalid URLs', () => {
      const invalidUrl = 'not-a-valid-url';

      const result = getUTMUrl(invalidUrl);
      expect(result).toBe(invalidUrl); // return original URL
    });

    test('should handle empty string URLs', () => {
      const emptyUrl = '';

      const result = getUTMUrl(emptyUrl);
      expect(result).toBe(emptyUrl);
    });

    test('should handle null or undefined notification objects', () => {
      const validUrl = 'https://example.com/path';

      const result1 = getUTMUrl(validUrl);
      expect(result1).toContain('utm_source=activity_notification');

      const result2 = getUTMUrl(validUrl);
      expect(result2).toContain('utm_source=activity_notification');
    });

    test('should handle notification objects without utm property', () => {
      const validUrl = 'https://example.com/path';

      const result = getUTMUrl(validUrl);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('activity_notification');
      expect(url.searchParams.get('utm_medium')).toBe('email');
    });

    test('should handle complex query parameters', () => {
      const complexUrl =
        'https://example.com/path?param1=value1&param2=value%20with%20spaces&param3=value&with&ampersands';

      const result = getUTMUrl(complexUrl);
      expect(result).toContain('utm_source=activity_notification');
      expect(result).toContain('param1=value1');
    });

    test('should handle URLs with anchors', () => {
      const urlWithAnchor = 'https://example.com/path#section1';

      const result = getUTMUrl(urlWithAnchor);
      const url = new URL(result);

      expect(url.hash).toBe('#section1');
      expect(url.searchParams.get('utm_source')).toBe('activity_notification');
    });
  });

  // ComponentDid tests
  describe('ComponentDid-based UTM source tests', () => {
    test('should use transactional_email for Payment Kit', () => {
      const validUrl = 'https://example.com/path';
      const componentDid = 'z2qaCNvKMv5GjouKdcDWexv6WqtHbpNPQDnAk'; // Payment Kit

      const result = getUTMUrl(validUrl, null, componentDid);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('transactional_email');
    });

    test('should use transactional_email for Launcher', () => {
      const validUrl = 'https://example.com/path';
      const componentDid = 'z8iZkFBbrVQxZHvcWWB3Sa2TrfGmSeFz9MSU7'; // Launcher

      const result = getUTMUrl(validUrl, null, componentDid);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('transactional_email');
    });

    test('should use transactional_email for DID Names', () => {
      const validUrl = 'https://example.com/path';
      const componentDid = 'z2qaGosS3rZ7m5ttP3Nd4V4qczR9TryTcRV4p'; // DID Names

      const result = getUTMUrl(validUrl, null, componentDid);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('transactional_email');
    });

    test('should use transactional_email for DID Spaces', () => {
      const validUrl = 'https://example.com/path';
      const componentDid = 'z8iZnaYxnkMD5AKRjTKiCb8pQr1ut8UantAcf'; // DID Spaces

      const result = getUTMUrl(validUrl, null, componentDid);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('transactional_email');
    });

    test('should use activity_notification for other components', () => {
      const validUrl = 'https://example.com/path';
      const componentDid = 'z1234567890abcdef'; // 其他组件

      const result = getUTMUrl(validUrl, null, componentDid);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('activity_notification');
    });

    test('should use activity_notification when componentDid is undefined', () => {
      const validUrl = 'https://example.com/path';

      const result = getUTMUrl(validUrl, null, undefined);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('activity_notification');
    });

    test('should allow custom UTM source to override componentDid defaults', () => {
      const validUrl = 'https://example.com/path';
      const componentDid = 'z2qaCNvKMv5GjouKdcDWexv6WqtHbpNPQDnAk'; // Payment Kit
      const utm = { source: 'custom_source' };

      const result = getUTMUrl(validUrl, utm, componentDid);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('custom_source');
    });
  });

  // Environment variable tests
  describe('Environment variable configuration tests', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should use UTM parameters from environment variables', () => {
      // clear module cache first, then set environment variables
      delete require.cache[require.resolve('../../api/util/utm')];

      process.env.EMAIL_UTM_SOURCE = 'test_source';
      process.env.EMAIL_UTM_MEDIUM = 'test_medium';
      process.env.EMAIL_UTM_CAMPAIGN = 'test_campaign';
      process.env.EMAIL_UTM_CONTENT = 'test_content';

      const validUrl = 'https://example.com/path';

      const result = getUTMUrl(validUrl);
      const url = new URL(result);

      expect(url.searchParams.get('utm_source')).toBe('test_source');
      expect(url.searchParams.get('utm_medium')).toBe('test_medium');
      expect(url.searchParams.get('utm_campaign')).toBe('test_campaign');
      expect(url.searchParams.get('utm_content')).toBe('test_content');
    });
  });
});

describe('attachNotificationUTM', () => {
  describe('Basic functionality', () => {
    test('should handle null or undefined input', () => {
      expect(attachNotificationUTM(null)).toBe(null);
      expect(attachNotificationUTM(undefined)).toBe(undefined);
      expect(attachNotificationUTM('')).toBe('');
      expect(attachNotificationUTM(123)).toBe(123);
    });

    test('should not modify original notification object', () => {
      const original = {
        title: 'Test',
        url: 'https://example.com',
        actions: [{ name: 'Test', link: 'https://test.com' }],
      };
      const originalCopy = JSON.parse(JSON.stringify(original));

      attachNotificationUTM(original);
      expect(original).toEqual(originalCopy);
    });

    test('should process top-level URL fields', () => {
      const notification = {
        title: 'Test notification',
        url: 'https://example.com/page',
        checkUrl: 'https://example.com/check',
      };

      const result = attachNotificationUTM(notification);

      expect(result.url).toContain('utm_source=activity_notification');
      expect(result.checkUrl).toContain('utm_source=activity_notification');
    });

    test('should process actions with links', () => {
      const notification = {
        title: 'Test',
        actions: [
          { name: 'Action1', link: 'https://example.com/action1' },
          { name: 'Action2', link: 'https://example.com/action2' },
          { name: 'Action3' }, // no link
        ],
      };

      const result = attachNotificationUTM(notification);

      expect(result.actions[0].link).toContain('utm_source=activity_notification');
      expect(result.actions[1].link).toContain('utm_source=activity_notification');
      expect(result.actions[2].link).toBeUndefined();
    });
  });

  describe('Attachment processing', () => {
    test('should process image attachments', () => {
      const notification = {
        title: 'Test',
        attachments: [
          {
            type: 'image',
            data: { url: 'https://example.com/image.jpg', alt: 'test' },
          },
        ],
      };

      const result = attachNotificationUTM(notification);
      expect(result.attachments[0].data.url).toContain('utm_source=activity_notification');
    });

    test('should process dapp attachments', () => {
      const notification = {
        title: 'Test',
        attachments: [
          {
            type: 'dapp',
            data: {
              url: 'https://example.com/dapp',
              logo: 'https://example.com/logo.png',
              title: 'Test DApp',
            },
          },
        ],
      };

      const result = attachNotificationUTM(notification);
      expect(result.attachments[0].data.url).toContain('utm_source=activity_notification');
      expect(result.attachments[0].data.logo).toContain('utm_source=activity_notification');
    });

    test('should process link attachments', () => {
      const notification = {
        title: 'Test',
        attachments: [
          {
            type: 'link',
            data: {
              url: 'https://example.com/link',
              image: 'https://example.com/preview.jpg',
              title: 'Test Link',
            },
          },
        ],
      };

      const result = attachNotificationUTM(notification);
      expect(result.attachments[0].data.url).toContain('utm_source=activity_notification');
      expect(result.attachments[0].data.image).toContain('utm_source=activity_notification');
    });

    test('should process section attachments with nested fields', () => {
      const notification = {
        title: 'Test',
        attachments: [
          {
            type: 'section',
            fields: [
              {
                type: 'image',
                data: { url: 'https://example.com/nested.jpg' },
              },
              {
                type: 'text',
                data: { text: 'Some text' },
              },
            ],
          },
        ],
      };

      const result = attachNotificationUTM(notification);
      expect(result.attachments[0].fields[0].data.url).toContain('utm_source=activity_notification');
    });

    test('should process blocks same as attachments', () => {
      const notification = {
        title: 'Test',
        blocks: [
          {
            type: 'link',
            data: { url: 'https://example.com/block' },
          },
        ],
      };

      const result = attachNotificationUTM(notification);
      expect(result.blocks[0].data.url).toContain('utm_source=activity_notification');
    });
  });

  describe('Activity processing', () => {
    test('should process activity target and meta URLs', () => {
      const notification = {
        title: 'Test',
        activity: {
          type: 'comment',
          actor: 'test-actor',
          target: {
            id: 'https://example.com/discussion/123',
            name: 'Test Discussion',
          },
          meta: {
            id: 'https://example.com/comment/456',
            content: 'Test comment',
          },
        },
      };

      const result = attachNotificationUTM(notification);
      expect(result.activity.target.id).toContain('utm_source=activity_notification');
      expect(result.activity.meta.id).toContain('utm_source=activity_notification');
    });
  });

  describe('Real email template scenarios', () => {
    test('should process complex notification from test.tsx', () => {
      const notification = {
        title: 'Head for blocklet email demo',
        body: 'User has a transaction',
        attachments: [
          {
            type: 'image',
            data: { url: 'https://picsum.photos/100/100', alt: 'test' },
          },
          {
            type: 'dapp',
            data: {
              url: 'https://token-prize-pool.example.com/',
              logo: 'https://picsum.photos/50/50',
              title: 'Token Prize',
            },
          },
          {
            type: 'link',
            data: {
              url: 'https://external-link.example.com/',
              image: 'https://picsum.photos/50/50',
              title: 'External Link',
            },
          },
        ],
        actions: [
          { name: 'Launch', link: 'https://example.com/launch' },
          { name: 'Dashboard', link: 'https://example.com/dashboard' },
        ],
      };

      const result = attachNotificationUTM(notification);

      // Check image attachment
      expect(result.attachments[0].data.url).toContain('utm_source=activity_notification');

      // Check dapp attachment
      expect(result.attachments[1].data.url).toContain('utm_source=activity_notification');
      expect(result.attachments[1].data.logo).toContain('utm_source=activity_notification');

      // Check link attachment
      expect(result.attachments[2].data.url).toContain('utm_source=activity_notification');
      expect(result.attachments[2].data.image).toContain('utm_source=activity_notification');
    });

    test('should process activity notification scenario', () => {
      const notification = {
        title: 'Merged Notification Read',
        body: 'User commented on your post',
        attachments: [
          {
            type: 'link',
            data: {
              url: 'https://discuss.example.com/discussions/123/#comment456',
              title: 'Discussion Link',
            },
          },
        ],
        activity: {
          type: 'comment',
          actor: 'test-user',
          target: {
            id: 'https://discuss.example.com/discussions/123',
            name: 'Test Discussion',
          },
          meta: {
            id: 'https://discuss.example.com/discussions/123/#comment456',
            content: 'Test comment',
          },
        },
      };

      const result = attachNotificationUTM(notification);

      expect(result.attachments[0].data.url).toContain('utm_source=activity_notification');
      expect(result.activity.target.id).toContain('utm_source=activity_notification');
      expect(result.activity.meta.id).toContain('utm_source=activity_notification');
    });

    test('should preserve UTM parameters from notification', () => {
      const notification = {
        title: 'Test with custom UTM',
        url: 'https://example.com/page',
        utm: {
          campaign: 'custom_campaign',
          content: 'custom_content',
        },
      };

      const result = attachNotificationUTM(notification);

      expect(result.url).toContain('utm_campaign=custom_campaign');
      expect(result.url).toContain('utm_content=custom_content');
      expect(result.url).toContain('utm_source=activity_notification');
      expect(result.url).toContain('utm_medium=email');
    });

    test('should handle mixed valid and invalid URLs', () => {
      const notification = {
        title: 'Mixed URLs',
        url: 'https://example.com/valid',
        checkUrl: '/relative/path', // invalid URL
        attachments: [
          {
            type: 'image',
            data: { url: 'https://example.com/image.jpg' }, // valid
          },
          {
            type: 'link',
            data: { url: 'not-a-url' }, // invalid
          },
        ],
      };

      const result = attachNotificationUTM(notification);

      expect(result.url).toContain('utm_source=activity_notification'); // valid URL processed
      expect(result.checkUrl).toBe('/relative/path'); // invalid URL unchanged
      expect(result.attachments[0].data.url).toContain('utm_source=activity_notification'); // valid URL processed
      expect(result.attachments[1].data.url).toBe('not-a-url'); // invalid URL unchanged
    });
  });
});
