/* eslint no-console:"off" */
/* eslint indent:"off" */
const fs = require('fs');
const path = require('path');
const sortBy = require('lodash/sortBy');
const camelcase = require('lodash/camelCase');
const upperFirst = require('lodash/upperFirst');
const { fakeMessage } = require('@arcblock/sdk-util/lib/util');

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
  Any: 'any',
};

const getFieldType = (type, ns = '') => {
  if (type.kind === 'NON_NULL') {
    return getFieldType(type.ofType);
  }

  if (type.kind === 'SCALAR') {
    return scalarTypes[type.name];
  }

  if (type.kind === 'LIST') {
    return `Array<...${ns ? `${ns}.` : ''}${
      type.ofType.kind === 'SCALAR' ? scalarTypes[type.ofType.name] : type.ofType.name
    }>`;
  }

  if (['OBJECT', 'ENUM', 'UNION', 'INPUT_OBJECT'].includes(type.kind)) {
    return `...${ns ? `${ns}.` : ''}${type.name}`;
  }
};

const printFakeMessage = (name, originName) => {
  try {
    let type = typesMap[name];
    if (originName && !type) {
      type =
        queries.find((x) => x.name === originName) ||
        mutations.find((x) => x.name === originName) ||
        subscriptions.find((x) => x.name === originName);

      if (type) {
        type.fields = type.args;
      }
    }
    return `
 *
 * Checkout the following snippet for the format of ${name}:
 * \`\`\`json
${JSON.stringify(fakeMessage(type, typesMap, 'fields'), true, '  ')}
 * \`\`\``;
  } catch (err) {
    console.error('cannot print fake message', name);
    return '';
  }
};

const generateInterface = ({ fields, name, originName }, ns = '') => `
/**
 * Structure of ${ns}.${name} ${
  name.startsWith('Response') || name.startsWith('Request') || name.endsWith('Params') || name.endsWith('Tx')
    ? printFakeMessage(name, originName)
    : ''
}
 *
 * @memberof ${ns}
 * @typedef {object} ${ns}.${name}
${(fields || []).map((x) => ` * @property {${getFieldType(x.type, ns)}} ${x.name}`).join('\n')}
 */`;

const generateTypeExport = (type, ns) => {
  if (type.kind === 'ENUM') {
    return '';
  }
  if (type.kind === 'UNION') {
    return '';
  }
  if (type.kind === 'INPUT_OBJECT') {
    console.log('generate input object', type.name);
    return generateInterface({ name: type.name, fields: type.inputFields }, ns);
  }

  return generateInterface(type, ns);
};

const getArgTypeName = (type) =>
  Array.isArray(type.args) && type.args.length ? upperFirst(camelcase(`${type.name}_params`)) : '';

const generateArgType = (type, ns) =>
  generateInterface(
    {
      fields: type.args,
      name: getArgTypeName(type),
      originName: type.name,
    },
    ns
  );

const generateArgs = (methods, ns) =>
  methods
    .filter((x) => Array.isArray(x.args) && x.args.length)
    .map((x) => generateArgType(x, ns))
    .join('\n');

const generateMethods = (methods, ns) =>
  methods
    .map((x) => {
      const namespace = ns ? `${ns}` : '';
      const argType = getArgTypeName(x);
      const returnType = getFieldType(x.type, ns) || 'void';
      const resultType = returnType.replace('...', '');
      return `
/**
 * ${x.name}
 *
 * @name ${namespace}#${x.name}${argType ? `\n * @param {${ns}.${argType}} params` : ''}
 * @function
 * @memberof ${ns}
 * @returns {Promise<${resultType}>} Checkout {@link ${resultType}} for resolved data format
 */
`;
    })
    .join('\n');

const dtsContent = `
/**
 * List all query method names
 *
 * @name ${namespace}#getQueries
 * @function
 * @memberof ${namespace}
 * @returns {Array<string>} method name list
 * @example
 * const methods = client.getQueries();
 * // list of query methods
 * // [
${client
  .getQueries()
  .map((x) => ` * //   ${x},`)
  .join('\n')}
 * // ]
 */

/**
 * List all mutation method names
 *
 * @name ${namespace}#getMutations
 * @function
 * @memberof ${namespace}
 * @returns {Array<string>} method name list
 * @example
 * const methods = client.getMutations();
 * // list of mutation methods
 * // [
${client
  .getMutations()
  .map((x) => ` * //   ${x},`)
  .join('\n')}
 * // ]
 */

/**
 * List all subscription method names
 *
 * @name ${namespace}#getSubscription
 * @function
 * @memberof ${namespace}
 * @returns {Array<string>} method name list
 * @example
 * const methods = client.getSubscriptions();
 * // list of subscription methods
 * // [
${client
  .getSubscriptions()
  .map((x) => ` * //   ${x},`)
  .join('\n')}
 * // ]
 */

/**
 * Send raw graphql query to token swap service
 *
 * @name ${namespace}#doRawQuery
 * @function
 * @memberof ${namespace}
 * @param {string} query - graphql query string
 * @returns {Promise} usually axios response data
 * @example
 * const res = await client.doRawQuery('
 *   getChainInfo {
 *     code
 *     info {
 *       address
 *       blockHeight
 *     }
 *   }
 * ');
 *
 * // Then
 * // res.getChainInfo.code
 * // res.getChainInfo.info
 */

/**
 * Send raw graphql subscription to forge graphql endpoint
 *
 * @name ${namespace}#doRawSubscription
 * @function
 * @memberof ${namespace}
 * @param {string} query - graphql query string
 * @returns {Promise} usually axios response data
 */

/**
 * Structure of ${namespace}.TxEncodeOutput
 *
 * @memberof ${namespace}
 * @typedef {object} ${namespace}.TxEncodeOutput
 * @property {object} object - the transaction object, human readable
 * @property {buffer} buffer - the transaction binary presentation, can be used to signing, encoding to other formats
 */

${sortBy(types, ['kind', 'name'])
  .filter((x) => !x.name.startsWith('__'))
  .filter((x) => !x.name.startsWith('Root'))
  .filter((x) => x.kind !== 'SCALAR')
  .map((x) => generateTypeExport(x, namespace))
  .filter(Boolean)
  .join('\n')}

${generateArgs(queries, namespace)}
${generateArgs(mutations, namespace)}
${generateArgs(subscriptions, namespace)}
${generateMethods(queries, namespace, 'QueryResult')}
${generateMethods(mutations, namespace, 'QueryResult')}
${generateMethods(subscriptions, namespace, 'SubscriptionResult')}
`;

const dtsFile = path.join(__dirname, '../src/types.js');
fs.writeFileSync(dtsFile, dtsContent);
console.log('generated types definitions: ', dtsFile);
