const { test, expect, describe, beforeEach, mock, spyOn, afterAll } = require('bun:test');

// Mock the external dependencies
mock.module('@abtnode/util/lib/axios', () => ({
  head: mock(),
}));
mock.module('../../lib/validators/util', () => ({
  passportDisplaySchema: {
    validate: mock(),
  },
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const axios = require('@abtnode/util/lib/axios');
const { passportDisplaySchema } = require('../../lib/validators/util');
const { validatePassportDisplay } = require('../../lib/api/team');

describe('validatePassportDisplay', () => {
  beforeEach(() => {
    mock.clearAllMocks();
    spyOn(console, 'info').mockReturnValue();
  });

  test('should do nothing if role.extra.display is not "custom"', async () => {
    const role = { extra: { display: 'standard' } };
    await expect(validatePassportDisplay(role, null)).resolves.toBeUndefined();
  });

  test('should throw an error if display is not provided for custom passport', async () => {
    const role = { name: 'test', extra: { display: 'custom' } };
    await expect(validatePassportDisplay(role, null)).rejects.toThrow('display is required for custom passport: test');
  });

  test('should throw an error if display is invalid', async () => {
    const role = { name: 'test', extra: { display: 'custom' } };
    const display = { type: 'invalid' };
    passportDisplaySchema.validate.mockReturnValue({ error: new Error('Invalid display') });
    await expect(validatePassportDisplay(role, display)).rejects.toThrow(
      'display invalid for custom passport: Invalid display'
    );
  });

  test('should validate successfully for non-url type display', async () => {
    const role = { name: 'test', extra: { display: 'custom' } };
    const display = { type: 'text', content: 'Test Display' };
    passportDisplaySchema.validate.mockReturnValue({ value: display });
    await expect(validatePassportDisplay(role, display)).resolves.toBeUndefined();
  });

  test('should throw an error if url is not accessible', async () => {
    const role = { name: 'test', extra: { display: 'custom' } };
    const display = { type: 'url', content: 'http://example.com/image.jpg' };
    passportDisplaySchema.validate.mockReturnValue({ value: display });
    axios.head.mockResolvedValue({ status: 404, statusText: 'Not Found' });
    await expect(validatePassportDisplay(role, display)).rejects.toThrow(
      'Passport display is not accessible: Not Found'
    );
  });

  test('should throw an error if content type is not an image', async () => {
    const role = { name: 'test', extra: { display: 'custom' } };
    const display = { type: 'url', content: 'http://example.com/image.jpg' };
    passportDisplaySchema.validate.mockReturnValue({ value: display });
    axios.head.mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    await expect(validatePassportDisplay(role, display)).rejects.toThrow(
      'Passport display does not return valid image: text/html'
    );
  });

  test('should validate successfully for valid image url', async () => {
    const role = { name: 'test', extra: { display: 'custom' } };
    const display = { type: 'url', content: 'http://example.com/image.jpg' };
    passportDisplaySchema.validate.mockReturnValue({ value: display });
    axios.head.mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    });
    await expect(validatePassportDisplay(role, display)).resolves.toBeUndefined();
  });

  test('should throw an error if axios throws an error', async () => {
    const role = { name: 'test', extra: { display: 'custom' } };
    const display = { type: 'url', content: 'http://example.com/image.jpg' };
    passportDisplaySchema.validate.mockReturnValue({ value: display });
    axios.head.mockRejectedValue(new Error('Network error'));
    await expect(validatePassportDisplay(role, display)).rejects.toThrow(
      'Error validating passport display: Network error'
    );
  });
});
