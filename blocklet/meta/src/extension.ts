import fs from 'fs';
import path from 'path';
import { isValid } from '@arcblock/did';
import { Extension, Root } from 'joi';

const fileExtension = (joi: Root): Extension => ({
  type: 'file',
  base: joi.string(),
  validate(value: string, { error }) {
    if (value && typeof value === 'string') {
      return { value };
    }
    return { errors: error('file.empty', { file: value }) };
  },
  messages: {
    'file.empty': 'file "{{#file}}" must be non-empty string',
    'file.enoent': 'file "{{#file}}" does not exist',
    'file.error.generic': 'file could not be read. message: "{{#message}}"',
  },
  rules: {
    exists: {
      multi: false,
      method({ baseDir = null, canSkip = () => false }: any = {}) {
        return this.$_addRule({ name: 'exists', args: { baseDir, canSkip } });
      },
      args: [
        {
          name: 'baseDir',
          assert: (baseDir) => fs.existsSync(baseDir),
          message: 'baseDir must exist',
        },
        {
          name: 'canSkip',
          assert: (canSkip) => typeof canSkip === 'function',
          message: 'canSkip must be a function',
        },
      ],
      validate(value, { error }, { baseDir, canSkip }: any = {}) {
        if (typeof canSkip === 'function' && canSkip(baseDir, value)) {
          return value;
        }
        try {
          fs.statSync(path.join(baseDir, value));
          return value;
        } catch (e) {
          switch (e.code) {
            case 'ENOENT':
              return error('file.enoent', { file: value });
            default:
          }
          return error('file.error.generic', { message: e.message });
        }
      },
    },
  },
});

/**
 * Joi extension for DID validation
 * Cannot perform role-type checking here because both old and new DID formats must be supported
 */
const didExtension = (joi: Root): Extension => ({
  type: 'DID',
  base: joi.string(),
  validate(value, { error }) {
    if (!value || typeof value !== 'string') {
      return { errors: error('did.empty', { did: value }) };
    }
    if (isValid(value) === false) {
      return { errors: error('did.invalid', { did: value }) };
    }
    return { value };
  },
  messages: {
    'did.empty': 'did "{{#did}}" must be non-empty string',
    'did.invalid': 'did "{{#did}}" is not valid',
  },
});

export { fileExtension };
export { didExtension };
export default {
  fileExtension,
  didExtension,
};
