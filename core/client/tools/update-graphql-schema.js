/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint no-console:"off" */
const fs = require('fs');
const path = require('path');
const { GraphQLClient } = require('graphql-request');
const { getIntrospectionQuery } = require('graphql');

const httpEndpoint = () => process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

(async () => {
  const dataSource = 'graphql';
  try {
    const endpoint = httpEndpoint(dataSource);
    const client = new GraphQLClient(endpoint);
    const result = await client.request(getIntrospectionQuery());
    console.log('schema result', result);
    if (result.__schema) {
      const schemaFile = path.join(__dirname, '../src/schema', `${dataSource}.json`);
      const schemaJson = JSON.stringify(result.__schema, true, '  ');
      fs.writeFileSync(schemaFile, schemaJson);
      console.log(`${dataSource} update success`, schemaFile);
    } else {
      console.log(`${dataSource} fetch failure`);
    }
  } catch (err) {
    console.error(err);
    console.log(`${dataSource} update error`);
  }
})();
