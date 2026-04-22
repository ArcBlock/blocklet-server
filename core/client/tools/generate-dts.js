/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint no-console:"off" */
/* eslint indent:"off" */
const fs = require('fs');
const path = require('path');
const sortBy = require('lodash/sortBy');
const camelcase = require('lodash/camelCase');
const upperFirst = require('lodash/upperFirst');

const Client = require('../lib/base');

const client = new Client('http://localhost:4000/graphql');
const schema = client._getSchema();
const { types, queryType, mutationType, subscriptionType } = schema;

const typesMap = types.reduce((acc, x) => {
  if (x.name.startsWith('__') === false) {
    acc[x.name] = x;
  }
  return acc;
}, {});

const queries = queryType.name ? typesMap[queryType.name].fields : [];
const mutations = mutationType.name ? typesMap[mutationType.name].fields : [];
const subscriptions = subscriptionType && subscriptionType.name ? typesMap[subscriptionType.name].fields : [];
const namespace = 'ABTNodeClient';

const scalarTypes = {
  Int: 'number',
  Int32: 'number',
  Uint32: 'number',
  Int64: 'number',
  Uint64: 'number',
  Float: 'number',
  Float32: 'number',
  String: 'string',
  HexString: 'string',
  DateTime: 'string',
  Boolean: 'boolean',
  Any: 'Record<string, any>',
};

const getFieldType = (type, ns = '') => {
  if (type.kind === 'NON_NULL') {
    return getFieldType(type.ofType, ns);
  }

  if (type.kind === 'SCALAR') {
    return scalarTypes[type.name];
  }

  if (type.kind === 'LIST') {
    return `${getFieldType(type.ofType.ofType || type.ofType, ns)}[]`;
  }

  if (['OBJECT', 'ENUM', 'UNION', 'INPUT_OBJECT'].includes(type.kind)) {
    return `${ns ? `${ns}.` : ''}${type.name}`;
  }
};

const generateInterface = ({ fields, name }, ns = '') => {
  return `
interface ${name} {
${(fields || []).map((x) => `  ${x.name}: ${getFieldType(x.type, ns)};`).join('\n')}
}`;
};

const generateUnion = ({ possibleTypes, name }, ns = '') => `
type ${name} = ${possibleTypes.map((x) => getFieldType(x, ns)).join(' | ')};`;

const generateEnum = ({ name, enumValues }, ns = '') => `
enum ${name} {
${(enumValues || []).map((x) => `  ${x.name},`).join('\n')}
}`;

const generateTypeExport = (type, ns) => {
  if (type.kind === 'ENUM') {
    return generateEnum(type, ns);
  }
  if (type.kind === 'UNION') {
    return generateUnion(type, ns);
  }

  type.fields = type.fields || type.inputFields;
  return generateInterface(type, ns);
};

const getArgTypeName = (type) =>
  Array.isArray(type.args) && type.args.length ? upperFirst(camelcase(`${type.name}_params`)) : '';

const generateArgType = (type, ns) =>
  generateInterface(
    {
      fields: type.args,
      name: getArgTypeName(type),
    },
    ns
  );

const generateMethodsExports = (methods, ns) =>
  methods
    .filter((x) => Array.isArray(x.args) && x.args.length)
    .map((x) => generateArgType(x, ns))
    .join('\n');

const generateMethods = (methods, ns) =>
  methods
    .map((x) => {
      // eslint-disable-next-line no-shadow
      const namespace = ns ? `${ns}.` : '';
      const argType = getArgTypeName(x);
      const params = argType ? `params: PartialDeep<${namespace}${argType}>` : '';
      const returnType = getFieldType(x.type, ns) || 'void';
      return `${x.name}(${params}): Promise<${returnType}>`;
    })
    .join('\n');

const dtsContent = `type PartialDeep<T> = {
  [K in keyof T]?: T[K] extends object ? PartialDeep<T[K]> : T[K]
}

export as namespace ${namespace};

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = ABTNodeClient;

/*~ Write your module's methods and properties in this class */
declare class ABTNodeClient {
  config: any;
  schema: void;
  constructor(httpEndpoint: string, userAgent: string = '');

  getQueries(): string[];
  getSubscriptions(): string[];
  getMutations(): string[];

  public setAuthToken(token: string): void;
  public setAuthAccessKey({ accessKeyId, accessKeySecret, type }: { accessKeyId: string; accessKeySecret: string, type: any }): void;

  protected _getAuthHeaders(): Promise<Record<string, string> | undefined>;

  /**
   * Send raw query to ocap and return results
   *
   * @param {*} query
   * @memberof BaseClient
   * @return Promise
   */
  doRawQuery(query: any, requestOptions?: any): Promise<any>;
  doRawSubscription(query: any): Promise<any>;

  doBatchQuery(queries: object, requestOptions?: any): Promise<object>;

  generateQueryFns(): void;
  generateSubscriptionFns(): void;
  generateMutationFns(): void;

  ${generateMethods(queries, namespace)}
  ${generateMethods(mutations, namespace)}
  ${generateMethods(subscriptions, namespace)}
}

declare namespace ${namespace} {
  export interface SubscriptionResult<T> {
    then(fn: (result: ABTNodeClient.Subscription<T>) => any): Promise<any>;
    catch(fn: (err: Error) => any): Promise<any>;
  }

  export interface Subscription<T> {
    on(event: 'data', fn: (data: T) => any): this;
    on(event: 'error', fn: (err: Error) => void): this;
  }

  export interface WalletTypeObject {
    pk: number;
    role: number;
    address: number;
    hash: number;
  }

  export interface EncodeTxResult {
    object: object;
    buffer: buffer;
  }

${sortBy(types, ['kind', 'name'])
  .filter((x) => !x.name.startsWith('__'))
  .filter((x) => !x.name.startsWith('Root'))
  .filter((x) => x.kind !== 'SCALAR')
  .map((x) => generateTypeExport(x, namespace))
  .join('\n')}

${generateMethodsExports(queries, namespace)}
${generateMethodsExports(mutations, namespace)}
${generateMethodsExports(subscriptions, namespace)}
}
`;

const environments = ['browser', 'node'];
environments.forEach((env) => {
  const dtsFile = path.join(__dirname, `../src/${env}.d.ts`);
  fs.writeFileSync(dtsFile, dtsContent);
  console.log('generated typescript definitions: ', dtsFile);
});
