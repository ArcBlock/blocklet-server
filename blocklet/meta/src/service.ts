import cloneDeep from 'lodash/cloneDeep';
import { authConfigSchema } from './schema';

const SERVICES = {};

const setService = (meta: { name: string; schema: any; default: any }): void => {
  SERVICES[meta.name] = {
    validate: meta.schema.validate.bind(meta.schema),
    defaultConfig: meta.default,
  };
};

setService({
  name: 'auth',
  schema: authConfigSchema,
  default: {},
});

const getService = (serviceName: string): any => {
  if (!serviceName) {
    throw new Error('service name should not be empty');
  }
  const service = SERVICES[serviceName];

  if (!service) {
    throw new Error(`service ${serviceName} does not exist`);
  }
  return service;
};

const getServiceConfig = (serviceName: string, customConfig: any, { validate }: { validate?: any } = {}): any => {
  const service = getService(serviceName);

  const data = cloneDeep(customConfig || {});

  const { value, error } = service.validate(data);

  if (validate && error) {
    throw new Error(`Invalid blocklet service config: ${error.details.map((x) => x.message).join(', ')}`);
  }

  return value;
};

const getDefaultServiceConfig = (serviceName: string): any => {
  const { defaultConfig } = getService(serviceName);

  return defaultConfig;
};

const findService = (services: any[], name: string): any => {
  const names = [name];
  return (services || []).find((x) => names.includes(x.name));
};

export { getServiceConfig };
export { getDefaultServiceConfig };
export { findService };
export { setService };

export default {
  getServiceConfig,
  getDefaultServiceConfig,
  findService,
  setService,
};
