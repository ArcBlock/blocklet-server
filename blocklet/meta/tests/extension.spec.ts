import { describe, test, expect } from 'bun:test';
import JOI from 'joi';
import { fileExtension, didExtension } from '../src/extension';

const Joi = JOI.extend(fileExtension).extend(didExtension);

describe('fileExtension', () => {
  test('should work as expected', () => {
    const baseDir = __dirname;

    const canSkip = (_dir: string, name: string) => name === 'can_skip';

    const { value } = Joi.file().exists({ baseDir }).validate(__filename);

    expect(value).toEqual(__filename);
    const { error } = Joi.file().exists({ baseDir }).validate('xxx');

    expect(error).toBeTruthy();
    const { value: value2 } = Joi.file().exists({ baseDir, canSkip }).validate('can_skip');

    expect(value2).toEqual('can_skip');
  });
});
describe('didExtension', () => {
  test('should work as expected', () => {
    const { error } = Joi.DID().validate('1234');

    expect(error).toBeTruthy();
    const { value } = Joi.DID().validate('z8ia22AX1PovjTi1YQw8ChgsbeVExYsX4dPFt');

    expect(value).toEqual('z8ia22AX1PovjTi1YQw8ChgsbeVExYsX4dPFt');
  });
});
