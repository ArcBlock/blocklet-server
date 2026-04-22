/* eslint-disable default-param-last */
const { graphqlHTTP } = require('express-graphql');
const GraphQLUpload = require('graphql-upload/GraphQLUpload.js');
const { isValid: isValidDid, toAddress } = require('@arcblock/did');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { wipeSensitiveData, fixBlockletStatus } = require('@blocklet/meta/lib/util');
const formatContext = require('@abtnode/util/lib/format-context');
const { CustomError } = require('@blocklet/error');
const schemaSource = require('@abtnode/schema');
const { Joi } = require('@arcblock/validator');
const logger = require('@abtnode/logger')('@abtnode/gql');
const genConfig = require('./config');

const pagingSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).default(20),
});

const wrapResolver = async ({ name, dataKeys, callback }) => {
  const t = Date.now();
  try {
    const result = await callback();

    const resultsMap = {};
    if (Array.isArray(dataKeys)) {
      dataKeys.forEach(dataKey => {
        resultsMap[dataKey] = result[dataKey];
      });
    } else {
      resultsMap[dataKeys] = result;
    }

    if (resultsMap.blocklet) {
      resultsMap.blocklet = wipeSensitiveData(resultsMap.blocklet);
      fixBlockletStatus(resultsMap.blocklet);
    }

    if (Array.isArray(resultsMap.blocklets)) {
      resultsMap.blocklets = resultsMap.blocklets.map(blocklet => {
        const safeData = wipeSensitiveData(blocklet);
        fixBlockletStatus(safeData);
        return safeData;
      });
    }

    if (dataKeys === 'info' && result && result.environments) {
      resultsMap[dataKeys] = {
        ...result,
        environments: result.environments.filter(x => x.key !== 'ABT_NODE_SK'),
      };
      delete resultsMap[dataKeys].sessionSalt;
    }

    // performance metrics
    const ms = Date.now() - t;
    if (ms > 2000) {
      logger.warn('graphql resolver latency', { api: name, time: `${ms}ms` });
    }

    return {
      code: 'ok',
      ...resultsMap,
    };
    /* istanbul ignore next */
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    } else {
      logger.error('graphql resolver error', { error });
    }
    throw error instanceof CustomError ? error : new CustomError(500, error.message);
  }
};

const ensureInputDid = input => {
  if (input) {
    const keys = [
      'appDid',
      'appPid',
      'blockletDid',
      'componentDid',
      'did',
      'nftDid',
      'ownerDid',
      'rootDid',
      'teamDid',
      'userDid',
    ];
    for (const key of keys) {
      if (input[key]) {
        if (Array.isArray(input[key])) {
          for (let i = 0; i < input[key].length; i++) {
            if (isValidDid(input[key][i]) === false) {
              throw new CustomError(400, `Invalid ${key}[${i}]: ${input[key][i]}`);
            }
            input[key][i] = toAddress(input[key][i]);
          }
        } else {
          if (isValidDid(input[key]) === false) {
            throw new CustomError(400, `Invalid ${key}: ${input[key]}`);
          }
          input[key] = toAddress(input[key]);
        }
      }
    }
  }
};

const ensureInputPaging = input => {
  if (input) {
    const { paging } = input;
    if (paging && typeof paging === 'object') {
      const { error } = pagingSchema.validate({
        page: paging.page,
        pageSize: paging.pageSize,
      });
      if (error) {
        throw new CustomError(400, `Invalid paging parameter: ${error.message}`);
      }
    }
  }
};

/**
 * @param {object} configs { <api>: { dataKeys, handler } }
 * @param {boolean} graphiql
 */
const createMiddleware = (configs = {}, graphiql = true) => {
  /* istanbul ignore next */
  const specials = {
    addRoutingSite: input => ({ site: input }),
  };

  const resolvers = Object.entries(configs).reduce((acc, [api, { dataKeys, handler }]) => {
    if (specials[api]) {
      acc[api] = ({ input } = {}, ctx) => {
        ensureInputDid(input);
        ensureInputPaging(input);
        return wrapResolver({ name: api, dataKeys, callback: () => handler(specials[api](input), formatContext(ctx)) });
      };
    } else {
      acc[api] = ({ input } = {}, ctx) => {
        ensureInputDid(input);
        ensureInputPaging(input);
        return wrapResolver({ name: api, dataKeys, callback: () => handler(input, formatContext(ctx)) });
      };
    }

    return acc;
  }, {});

  return graphqlHTTP({
    schema: makeExecutableSchema({
      typeDefs: schemaSource,
      resolvers: {
        Upload: GraphQLUpload,
      },
    }),
    customFormatErrorFn: error => {
      logger.error('graphql error', { error });
      return {
        message: error.message,
        locations: error.locations,
        stack: error.stack ? error.stack.split('\n') : [],
        path: error.path,
      };
    },
    rootValue: resolvers,
    graphiql,
  });
};

module.exports = createMiddleware;
module.exports.wrapResolver = wrapResolver;
module.exports.formatContext = formatContext;
module.exports.genConfig = genConfig;
module.exports.ensureInputDid = ensureInputDid;
module.exports.ensureInputPaging = ensureInputPaging;
