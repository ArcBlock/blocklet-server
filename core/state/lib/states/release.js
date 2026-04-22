const pick = require('lodash/pick');
const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').ReleaseState>
 */
class Release extends BaseState {
  getReleases({ projectId, status } = {}) {
    const query = { projectId };
    if (status) {
      query.status = status;
    }
    return this.find(
      query,
      {},
      {
        createdAt: -1,
      }
    );
  }

  async upsertRelease({ releaseId, ...params }) {
    const _params = pick(params, [
      'projectId',
      'blockletDid',
      'blockletVersion',
      'blockletTitle',
      'blockletDescription',
      'blockletLogo',
      'blockletIntroduction',
      'blockletScreenshots',
      'blockletResourceType',
      'blockletHomepage',
      'blockletVideos',
      'blockletSupport',
      'blockletCommunity',
      'blockletRepository',
      'blockletDocker',
      'blockletSingleton',
      'contentType',
      'publishedStoreIds',
      'blockletComponents',
      'uploadedResource',
      'note',
      'status',
      'files',
    ]);

    if (!releaseId) {
      return this.insert(_params);
    }

    const [, [updated]] = await this.update({ id: releaseId }, { $set: _params });
    return updated;
  }
}

module.exports = Release;
