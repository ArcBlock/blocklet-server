const { describe, expect, mock, test } = require('bun:test');

const { sanitizeEmailHeader, sendEmail, validateEmailAddress } = require('../../api/libs/email');

describe('email security helpers', () => {
  test('should accept ordinary email addresses', () => {
    expect(validateEmailAddress('user@example.com')).toBe('user@example.com');
    expect(validateEmailAddress(' User.Name+tag@example.com ')).toBe('User.Name+tag@example.com');
  });

  test('should reject address parser abuse payloads', () => {
    const payloads = [
      'g0: g1: g2: victim@example.com;',
      '"xclow3n@gmail.com x"@internal.domain',
      'victim@example.com\r\nBcc: attacker@example.com',
      'victim@example.com,attacker@example.com',
      'Display Name <victim@example.com>',
    ];

    payloads.forEach((payload) => {
      expect(() => validateEmailAddress(payload, 'receiver')).toThrow(/Invalid receiver/);
    });
  });

  test('should reject CRLF in email headers', () => {
    expect(() => sanitizeEmailHeader('hello\r\nBcc: attacker@example.com', 'subject')).toThrow(/Invalid subject/);
  });

  test('should reject malicious receivers before loading blocklet email config', async () => {
    const node = { getBlocklet: mock() };

    await expect(
      sendEmail('g0: g1: victim@example.com;', { title: 'Hello' }, { teamDid: 'test-team', node })
    ).rejects.toThrow(/Invalid receiver/);
    expect(node.getBlocklet).not.toHaveBeenCalled();
  });
});
