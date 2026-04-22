const { it, expect, describe } = require('bun:test');
const { createReleaseSchema } = require('../../lib/validators/project');

describe('validator.createReleaseSchema', () => {
  it('should return error on empty dockerImage', () => {
    const input = {
      blockletScreenshots: [],
      blockletVideos: [],
      uploadedResource: '',
      contentType: 'docker',
      blockletResourceType: '',
      blockletSupport: '',
      blockletCommunity: '',
      blockletHomepage: '',
      blockletRepository: '',
      blockletDocker: {
        dockerImage: 'postgres',
        dockerArgs: [
          {
            key: '--volume',
            value: '$BLOCKLET_DATA_DIR/custom/mount:/var/lib/postgresql/data',
          },
        ],
        dockerEnvs: [
          { key: 'POSTGRES_PASSWORD', value: 'mysecretpassword' },
          { key: 'PGDATA', value: '/var/lib/postgresql/data/pgdata' },
        ],
      },
      blockletVersion: '1.0.16',
      blockletTitle: 'aaaa',
      blockletDescription: 'aaa',
      blockletLogo: null,
      blockletIntroduction: '',
      blockletComponents: [],
      note: '33',
    };
    const result = createReleaseSchema('published').validate(input);
    expect(result.error).toBeUndefined();
  });
});
