import { describe, mock, expect, beforeEach, afterEach, it } from 'bun:test';
import stableStringify from 'json-stable-stringify';
import { verifyResponse } from './utils';
import type { VerifyFn } from '../types';

describe('verifyResponse', () => {
  let mockOnInvalid: () => void;
  let originalWindow: any;

  beforeEach(() => {
    // Store original values
    originalWindow = globalThis.window;

    // Create a real callback function
    mockOnInvalid = mock(() => {});

    // Set up window.blocklet with test data
    Object.defineProperty(globalThis, 'window', {
      value: {
        blocklet: {
          appId: 'zNKtCNqYWLYWYW3gWRA1vnRykf4ZYvZ1ni1U',
          appPk: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
    });
  });

  it('should pass through response when not an object', async () => {
    const response = {
      status: 200,
      data: 'not-an-object',
    };

    expect(await verifyResponse(response, mockOnInvalid)).toBe(response);
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should pass through response when status is not 2xx', async () => {
    const response = {
      status: 400,
      data: { foo: 'bar' },
    };

    expect(await verifyResponse(response, mockOnInvalid)).toBe(response);
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should skip verification when verifyFn is not provided', async () => {
    const response = {
      status: 200,
      data: { foo: 'bar' },
    };

    // Without verifyFn, should skip verification and return response
    expect(await verifyResponse(response, mockOnInvalid)).toBe(response);
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should throw error when signature is missing and verifyFn is provided', async () => {
    const mockVerifyFn: VerifyFn = mock(() => true);
    const response = {
      status: 200,
      data: { foo: 'bar' },
    };

    await expect(() => verifyResponse(response, mockOnInvalid, mockVerifyFn)).toThrow('Invalid response');
    expect(mockOnInvalid).toHaveBeenCalled();
  });

  it('should throw error when verifyFn returns false', async () => {
    const mockVerifyFn: VerifyFn = mock(() => false);
    const response = {
      status: 200,
      data: {
        foo: 'bar',
        $signature: 'some-signature',
      },
    };

    await expect(() => verifyResponse(response, mockOnInvalid, mockVerifyFn)).toThrow('Invalid response');
    expect(mockOnInvalid).toHaveBeenCalled();
  });

  it('should call verifyFn with correct parameters', async () => {
    const mockVerifyFn: VerifyFn = mock(() => true);
    const data = { foo: 'bar' };
    const signature = 'test-signature';
    const response = {
      status: 200,
      data: {
        ...data,
        $signature: signature,
      },
    };

    await verifyResponse(response, mockOnInvalid, mockVerifyFn);

    expect(mockVerifyFn).toHaveBeenCalledWith(
      stableStringify(data),
      signature,
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'zNKtCNqYWLYWYW3gWRA1vnRykf4ZYvZ1ni1U'
    );
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should verify and return response when verifyFn returns true', async () => {
    const mockVerifyFn: VerifyFn = mock(() => true);
    const data = { foo: 'bar' };
    const response = {
      status: 200,
      data: {
        ...data,
        $signature: 'valid-signature',
      },
    };

    expect(await verifyResponse(response, mockOnInvalid, mockVerifyFn)).toBe(response);
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should support async verifyFn', async () => {
    const mockVerifyFn: VerifyFn = mock(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });
      return true;
    });
    const data = { foo: 'bar' };
    const response = {
      status: 200,
      data: {
        ...data,
        $signature: 'valid-signature',
      },
    };

    expect(await verifyResponse(response, mockOnInvalid, mockVerifyFn)).toBe(response);
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should pass through response when window.blocklet is not available', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: {},
      writable: true,
    });

    const mockVerifyFn: VerifyFn = mock(() => true);
    const response = {
      status: 200,
      data: {
        foo: 'bar',
        $signature: 'some-signature',
      },
    };

    expect(await verifyResponse(response, mockOnInvalid, mockVerifyFn)).toBe(response);
    // verifyFn should not be called when window.blocklet is missing
    expect(mockVerifyFn).not.toHaveBeenCalled();
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should pass through response when window.blocklet.appId is missing', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        blocklet: {
          appPk: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
      writable: true,
    });

    const mockVerifyFn: VerifyFn = mock(() => true);
    const response = {
      status: 200,
      data: {
        foo: 'bar',
        $signature: 'some-signature',
      },
    };

    expect(await verifyResponse(response, mockOnInvalid, mockVerifyFn)).toBe(response);
    expect(mockVerifyFn).not.toHaveBeenCalled();
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should pass through response when window.blocklet.appPk is missing', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        blocklet: {
          appId: 'zNKtCNqYWLYWYW3gWRA1vnRykf4ZYvZ1ni1U',
        },
      },
      writable: true,
    });

    const mockVerifyFn: VerifyFn = mock(() => true);
    const response = {
      status: 200,
      data: {
        foo: 'bar',
        $signature: 'some-signature',
      },
    };

    expect(await verifyResponse(response, mockOnInvalid, mockVerifyFn)).toBe(response);
    expect(mockVerifyFn).not.toHaveBeenCalled();
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });

  it('should handle complex data structures with verifyFn', async () => {
    const mockVerifyFn: VerifyFn = mock(() => true);
    const complexData = {
      user: {
        name: 'test',
        age: 25,
      },
      items: [1, 2, 3],
      nested: {
        deep: {
          value: 'hello',
        },
      },
    };

    const response = {
      status: 200,
      data: {
        ...complexData,
        $signature: 'complex-signature',
      },
    };

    expect(await verifyResponse(response, mockOnInvalid, mockVerifyFn)).toBe(response);

    // Verify that verifyFn was called with the data without $signature
    expect(mockVerifyFn).toHaveBeenCalledWith(
      stableStringify(complexData),
      'complex-signature',
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'zNKtCNqYWLYWYW3gWRA1vnRykf4ZYvZ1ni1U'
    );
    expect(mockOnInvalid).not.toHaveBeenCalled();
  });
});
