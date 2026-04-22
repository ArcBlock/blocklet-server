const { it, expect, describe } = require('bun:test');
const { validateCreatePermission, validateUpdatePermission } = require('../../lib/validators/permission');

const validName = 'a_b';
const validDescription = 'a';

describe('validator.permission', () => {
  it('should pass validate', () => {
    expect(validateCreatePermission({ name: validName, description: validDescription })).resolves.toBeTruthy();
    expect(validateUpdatePermission({ name: validName, description: validDescription })).resolves.toBeTruthy();
  });

  it('should throw error if invalid permission name', () => {
    expect(validateCreatePermission({ name: 'a_b_c', description: validDescription })).rejects.toThrow('Too much "_"');
    expect(validateUpdatePermission({ name: 'a_b_c', description: validDescription })).rejects.toThrow('Too much "_"');
    expect(validateCreatePermission({ name: 'a', description: validDescription })).rejects.toThrow(
      'The format of permission name should be'
    );
    expect(validateUpdatePermission({ name: 'a', description: validDescription })).rejects.toThrow(
      'The format of permission name should be'
    );
  });

  it('should throw error if empty permission name', () => {
    expect(validateCreatePermission({ name: '', description: validDescription })).rejects.toBeTruthy();
    expect(validateUpdatePermission({ name: '', description: validDescription })).rejects.toBeTruthy();
  });

  it('should throw error if empty permission name', () => {
    expect(validateCreatePermission({ name: validName, description: '' })).rejects.toBeTruthy();
    expect(validateUpdatePermission({ name: validName, description: '' })).rejects.toBeTruthy();
  });

  it('should throw error if name too long', () => {
    const longName = new Array(65).fill('a').join('');
    expect(validateCreatePermission({ name: longName, description: validDescription })).rejects.toBeTruthy();
    expect(validateUpdatePermission({ name: longName, description: validDescription })).rejects.toBeTruthy();
  });

  it('should throw error if description too long', () => {
    const longDescription = new Array(601).fill('a').join('');
    expect(validateCreatePermission({ name: validName, description: longDescription })).rejects.toBeTruthy();
    expect(validateUpdatePermission({ name: validName, description: longDescription })).rejects.toBeTruthy();
  });
});
