import { createBlockletSchema } from './schema';
import { getServiceConfig } from './service';
import { TBlockletMeta } from './types';

const fixAndValidateService = (meta: TBlockletMeta): TBlockletMeta => {
  if (!meta.interfaces) {
    return meta;
  }
  if (!meta.interfaces.length) {
    return meta;
  }
  meta.interfaces.forEach((d) => {
    if (d.services && d.services.length) {
      d.services.forEach((s) => {
        s.config = getServiceConfig(s.name, s.config, { validate: true });
      });
    }
  });
  return meta;
};

const validateMeta = (
  meta: any,
  {
    ensureFiles = false,
    ensureDist = false,
    ensureComponentStore = true,
    ensureName = false,
    skipValidateDidName = false,
    schemaOptions = {},
  }: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    ensureName?: boolean;
    skipValidateDidName?: boolean;
    schemaOptions?: any;
  } = {}
): TBlockletMeta => {
  const schema = createBlockletSchema(null, {
    ensureFiles,
    ensureDist,
    ensureComponentStore,
    ensureName,
    skipValidateDidName,
    ...schemaOptions,
  });
  const { value, error } = schema.validate(meta);
  if (error) {
    throw new Error(`Invalid blocklet meta: ${error.details.map((x) => x.message).join(', ')}`);
  }
  return value;
};

export default validateMeta;
export { validateMeta, fixAndValidateService };
