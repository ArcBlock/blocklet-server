const validUrl = require('valid-url');

const { createConnect } = require('@blocklet/store');
const { joinURL } = require('ufo');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { getDisplayName } = require('@blocklet/meta/lib/util');

const connectToEndpoint = async ({ did, projectId, endpointId, manager, context }) => {
  if (!did) {
    throw new Error('Invalid did');
  }

  const endpointList = await manager.teamManager.getEndpointList(did);
  const endpoint = endpointList.find((x) => x.id === endpointId);
  if (!endpoint) {
    throw new Error('Endpoint not found');
  }

  const { url: endpointUrl } = endpoint;
  if (!validUrl.isWebUri(endpointUrl)) {
    throw new Error('Invalid endpoint url:', endpointUrl);
  }

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const blocklet = await manager.getBlocklet(did);
      const fetchData = await createConnect({
        connectUrl: joinURL(new URL(endpointUrl).origin, WELLKNOWN_SERVICE_PATH_PREFIX),
        connectAction: 'gen-access-key',
        enableEncrypt: true,
        source: `connect to blocklet studio (${getDisplayName(blocklet)})`,
        closeOnSuccess: true,
        openPage: (pageUrl) => resolve(pageUrl),
      });

      const { accessKeyId, accessKeySecret, developerDid, expireAt, developerName, developerEmail } = fetchData;
      const { projectState } = await manager._getProjectState(did);
      const project = await projectState.findOne({ id: projectId });

      if (!project.connectedEndpoints) {
        project.connectedEndpoints = [];
      }

      const nextEndpoint = {
        endpointId,
        accessKeyId,
        accessKeySecret,
        expireAt,
        developerDid,
        developerName,
        developerEmail,
        createdBy: context?.user?.did,
      };

      const oldEndpoint = project.connectedEndpoints.find((x) => x.endpointId === endpointId);
      if (oldEndpoint) {
        Object.assign(oldEndpoint, nextEndpoint);
      } else {
        project.connectedEndpoints.push(nextEndpoint);
      }

      await projectState.updateProject(projectId, project);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = connectToEndpoint;
