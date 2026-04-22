const { describe, test, expect, beforeAll, afterEach } = require('bun:test');
const VerifyCodeState = require('../../lib/states/verify-code');
const { setupInMemoryBlockletModels } = require('../../tools/fixture');

describe('VerifyCodeState', () => {
  let state = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryBlockletModels();
    state = new VerifyCodeState(models.VerifyCode, {});
  });

  afterEach(async () => {
    await state.reset();
  });

  const testEmail = 'TEST@example.com';
  const testScope = 'email';

  test('should create a verify code', async () => {
    const result = await state.create(testEmail, testScope);
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('subject', testEmail.toLowerCase());
    expect(result).toHaveProperty('scope', testScope);
    expect(result).toHaveProperty('verified', false);
    expect(result).toHaveProperty('expired', false);
    expect(result).toHaveProperty('sent', false);
    expect(result).toHaveProperty('issued', false);
  });

  test('should throw error for invalid email', async () => {
    await expect(state.create('invalid-email')).rejects.toThrow('Invalid email specified when create verify code');
  });

  test('should verify a valid code', async () => {
    const { code } = await state.create(testEmail);
    let result = await state.verify(code);
    expect(result).toHaveProperty('verified', true);
    expect(result).toHaveProperty('verifiedAt');

    result = await state.issue(code);
    expect(result).toHaveProperty('issued', true);
    expect(result).toHaveProperty('issuedAt');

    const isIssued = await state.isIssued(testEmail);
    expect(isIssued).toBe(true);
  });

  test('should throw error for invalid code', async () => {
    await expect(state.verify('invalid-code')).rejects.toThrow('verify code invalid');
  });

  test('should throw error for expired code', async () => {
    const { code } = await state.create(testEmail);
    await state.update({ code }, { expired: true });
    await expect(state.verify(code)).rejects.toThrow('verify code has expired');
  });

  test('should throw error for consumed code', async () => {
    const { code } = await state.create(testEmail);
    await state.verify(code);
    await expect(state.verify(code)).rejects.toThrow('verify code has been consumed');
  });

  test('should send a verify code', async () => {
    const { code } = await state.create(testEmail);
    await state.send(code);
    const result = await state.findOne({ code });
    expect(result).toHaveProperty('sent', true);
    expect(result).toHaveProperty('sentAt');
  });

  test('should throw error when sending an invalid code', async () => {
    await expect(state.send('invalid-code')).rejects.toThrow('verify code invalid');
  });

  test('should throw error when sending an already sent code', async () => {
    const { code } = await state.create(testEmail);
    await state.send(code);
    await expect(state.send(code)).rejects.toThrow('verify code has sent');
  });

  test('should check if a subject is verified', async () => {
    const { code } = await state.create(testEmail);
    await state.verify(code);
    const isVerified = await state.isVerified(testEmail);
    expect(isVerified).toBe(true);
  });

  test('should check if a code is sent', async () => {
    const { code } = await state.create(testEmail);
    await state.send(code);
    const isSent = await state.isSent(testEmail);
    expect(isSent).toBe(true);
  });

  test('should generate a unique verify code', async () => {
    const code1 = await state.getVerifyCode();
    const code2 = await state.getVerifyCode();
    expect(code1).not.toBe(code2);
  });
});
