import { describe, test, expect } from 'bun:test';
import { toBlockletDid } from '../src/index';

describe('toBlockletDid', () => {
  test('should not throw error on special chars', () => {
    expect(toBlockletDid('q23Q@( #EIOP(!@I')).toEqual('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z');
    expect(toBlockletDid('q23Q@( #EIOP(!@I ')).toEqual('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z');
    expect(toBlockletDid(' q23Q@( #EIOP(!@I ')).toEqual('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z');
    expect(toBlockletDid(Buffer.from('q23Q@( #EIOP(!@I', 'utf8'))).toEqual('z8iZvvDj3C14L3ajefKeGMKFBxE3DJCdJij7z');
  });
  test('should not throw error on suspicious characters', () => {
    expect(toBlockletDid('zero-demo')).toEqual('z8iZvUKWGvDyi8Woc886fErHrfFrAVRFGUgeE');
    expect(toBlockletDid(Buffer.from('zero-demo'))).toEqual('z8iZvUKWGvDyi8Woc886fErHrfFrAVRFGUgeE');
  });
  test('should not throw error on 0x', () => {
    expect(toBlockletDid('0xdog')).toEqual('z8ia2Db5BM5ENU1kY4iFkxD9vZCcmL8v1Rfjo');
    expect(toBlockletDid(Buffer.from('0xdog'))).toEqual('z8ia2Db5BM5ENU1kY4iFkxD9vZCcmL8v1Rfjo');
  });
  test('should not throw error on blocklet-did input', () => {
    expect(toBlockletDid('z2qaFjCnK9JtYinBLEogSJ7BJZTjSixAxtbmX')).toEqual('z2qaFjCnK9JtYinBLEogSJ7BJZTjSixAxtbmX');
    expect(toBlockletDid('z2qa3humMNNEoiupo4FnL338oAnZTdVWTyLgv')).toEqual('z2qa3humMNNEoiupo4FnL338oAnZTdVWTyLgv');
    expect(toBlockletDid('z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9')).toEqual('z2qaG5TkdGGmxmEpkyDq1Lxjct1yJfXfzdTc9');
  });
});
