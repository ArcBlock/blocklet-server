const pickBy = require('lodash/pickBy');
const pick = require('lodash/pick');
const { CustomError } = require('@blocklet/error');
const BaseState = require('./base');

const isUndefinedOrNull = (x) => x === undefined || x === null;

/**
 * @extends BaseState<import('@abtnode/models').ProjectState>
 */
class Project extends BaseState {
  createProject({
    type,
    blockletDid,
    blockletTitle,
    componentDid,
    tenantScope,
    connectedStores,
    createdBy,
    messageId,
    autoUpload,
    possibleSameStore,
    connectedEndpoints,
  }) {
    const doc = { id: blockletDid, type, blockletDid, blockletTitle, createdBy, autoUpload, possibleSameStore };
    if (componentDid) {
      doc.componentDid = componentDid;
    }
    if (tenantScope) {
      doc.tenantScope = tenantScope;
    }
    if (connectedStores) {
      doc.connectedStores = connectedStores;
    }
    if (connectedEndpoints) {
      doc.connectedEndpoints = connectedEndpoints;
    }
    if (messageId) {
      if (messageId.length < 20) {
        throw new CustomError(400, 'Invalid messageId');
      }
      doc.messageId = messageId;
    }
    return this.insert(doc);
  }

  async getProjects({ componentDid, tenantScope, showAccessToken, createdBy }) {
    const query = {};
    if (componentDid) {
      query.componentDid = componentDid;
    }
    if (tenantScope) {
      query.tenantScope = tenantScope;
    }
    if (createdBy) {
      query.createdBy = createdBy;
    }
    const projects = await this.find(
      query,
      {},
      {
        createdAt: -1,
      }
    );
    if (!showAccessToken) {
      projects?.forEach((project) => {
        project.connectedStores?.forEach((store) => {
          store.accessToken = store.accessToken ? '__encrypted__' : '';
        });
      });
    }

    if (!showAccessToken) {
      projects.connectedEndpoints?.forEach((endpoint) => {
        endpoint.accessKeySecret = endpoint.accessKeySecret ? '__encrypted__' : '';
      });
    }

    return projects;
  }

  async updateProject(id, params) {
    const _params = pickBy(
      pick(params, [
        'name',
        'blockletLogo',
        'blockletVersion',
        'blockletIntroduction',
        'blockletTitle',
        'blockletDescription',
        'blockletDid',
        'blockletScreenshots',
        'lastReleaseId',
        'lastReleaseFiles',
        'connectedStores',
        'autoUpload',
        'possibleSameStore',
        'connectedEndpoints',
      ]),
      (x) => !isUndefinedOrNull(x)
    );
    _params.type = params.blockletComponents?.length ? 'pack' : 'resource';
    const [, [updated]] = await this.update({ id }, { $set: _params });
    return updated;
  }

  async deleteConnectedStore({ projectId, storeId, createdBy }) {
    const project = await this.findOne({ id: projectId });
    if (!project) {
      throw new CustomError(404, 'Project not found');
    }
    const index = (project.connectedStores || []).findIndex(
      (x) => x.storeId === storeId && (createdBy ? x.createdBy === createdBy : true)
    );
    if (index === -1) {
      return null;
    }
    project.connectedStores.splice(index, 1);
    const [, [updated]] = await this.update({ id: projectId }, { $set: { connectedStores: project.connectedStores } });

    return updated;
  }

  async deleteConnectedEndpoint({ projectId, endpointId, createdBy }) {
    const project = await this.findOne({ id: projectId });
    if (!project) {
      throw new CustomError(404, 'Project not found');
    }
    const index = (project.connectedEndpoints || []).findIndex(
      (x) => x.endpointId === endpointId && (createdBy ? x.createdBy === createdBy : true)
    );
    if (index === -1) {
      return null;
    }
    project.connectedEndpoints.splice(index, 1);
    const [, [updated]] = await this.update(
      { id: projectId },
      { $set: { connectedEndpoints: project.connectedEndpoints } }
    );

    return updated;
  }

  async getConnectedStore(id, storeId) {
    const project = await this.findOne({ id });
    if (!project) {
      throw new CustomError(404, 'Project not found');
    }

    return project.connectedStores?.find((x) => x.storeId === storeId);
  }

  async getConnectedEndpoint(id, endpointId) {
    const project = await this.findOne({ id });
    if (!project) {
      throw new CustomError(404, 'Project not found');
    }

    return project.connectedEndpoints?.find((x) => x.endpointId === endpointId);
  }
}

module.exports = Project;
