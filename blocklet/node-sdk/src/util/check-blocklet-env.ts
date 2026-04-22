const checkBlockletEnvironment = () => {
  const envNames = [
    'BLOCKLET_APP_ID',
    'BLOCKLET_APP_NAME',
    'BLOCKLET_APP_DESCRIPTION',
    'BLOCKLET_DID',
    'BLOCKLET_APP_EK',
    'ABT_NODE_DID',
    'ABT_NODE_PK',
    'ABT_NODE_PORT',
    'ABT_NODE_SERVICE_PORT',
  ];
  envNames.forEach((envName) => {
    if (!process.env[envName]) {
      throw new Error(`${envName} does not exist in environments`);
    }
  });
};

export { checkBlockletEnvironment };
