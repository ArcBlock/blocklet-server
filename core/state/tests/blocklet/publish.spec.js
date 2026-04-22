const { test, describe, beforeAll, afterAll, beforeEach, afterEach, expect } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { BlockletEvents } = require('@blocklet/constant');

const { setupInstance, tearDownInstance } = require('../../tools/fixture');

const appWallet = fromRandom({ role: types.RoleType.ROLE_APPLICATION });
const appDid = appWallet.address;
const appSk = appWallet.secretKey;

describe('Blocklet Publish', () => {
  let instance = null;
  let manager = null;
  let context = {};
  let installStaticDemo = () => {};
  let removeStaticDemo = () => {};
  const staticDemoDid = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
  const blockletDid = fromRandom({ role: types.RoleType.ROLE_BLOCKLET }).address;

  beforeAll(async () => {
    instance = await setupInstance('blocklet-publish');
    manager = instance.blockletManager;
    context = {
      hostname: 'test.server.com',
      user: {
        did: fromRandom().address,
      },
    };

    installStaticDemo = async () => {
      const url = `file://${path.join(__dirname, `../assets/api/blocklets/${staticDemoDid}/blocklet.json`)}`;
      await manager.install({ url, appSk }, context);
      await new Promise((resolve) => manager.on(BlockletEvents.installed, resolve));
    };

    removeStaticDemo = (keepData = false) => manager.delete({ did: appDid, keepData });
  });

  beforeEach(async () => {
    await installStaticDemo();
  });

  afterEach(async () => {
    const blocklet = await instance.states.blocklet.getBlocklet(appDid);
    if (blocklet) {
      await removeStaticDemo();
    }
  });

  test('publish', async () => {
    expect(typeof manager.getProjects).toBe('function');
    expect(typeof manager.getProject).toBe('function');
    expect(typeof manager.createProject).toBe('function');
    expect(typeof manager.updateProject).toBe('function');
    expect(typeof manager.deleteProject).toBe('function');
    expect(typeof manager.getReleases).toBe('function');
    expect(typeof manager.getRelease).toBe('function');
    expect(typeof manager.createRelease).toBe('function');
    expect(typeof manager.deleteRelease).toBe('function');

    const b1 = await manager.getBlocklet(appDid);
    const { dataDir } = b1.env;

    // https://github.com/ArcBlock/blocklet-server/commit/a076832b6ed61afc35b9461c853cb84adeee2cdf
    // 该 commit 会确保 .projects 文件夹存在，所以以下判读失效了
    // expect(fs.existsSync(path.join(dataDir, '.projects'))).toBe(false);

    await manager.createProject({ did: appDid, type: 'resource', blockletDid, blockletTitle: 'demo1' }, context);

    expect(fs.existsSync(path.join(dataDir, '.projects'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, '.projects', blockletDid))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, '.projects', blockletDid, 'resource'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, '.projects', blockletDid, 'releases'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, '.projects', blockletDid, 'assets'))).toBe(true);

    const { projects } = await manager.getProjects({ did: appDid }, context);
    expect(projects.length).toBe(1);
    expect(projects[0].blockletDid).toBe(blockletDid);
    expect(projects[0].blockletTitle).toBe('demo1');
    expect(projects[0].id).toBe(blockletDid);
    expect(projects[0].type).toBe('resource');

    const p1 = await manager.getProject({ did: appDid, projectId: blockletDid }, context);
    expect(p1.blockletDid).toBe(blockletDid);
    expect(p1.blockletTitle).toBe('demo1');
    expect(p1.id).toBe(blockletDid);
    expect(p1.type).toBe('resource');
    expect(p1.blockletDescription).toBeFalsy();

    await manager.updateProject({ did: appDid, projectId: blockletDid, blockletDescription: 'demo desc' }, context);
    const p2 = await manager.getProject({ did: appDid, projectId: blockletDid }, context);
    expect(p2.blockletDescription).toBe('demo desc');

    await manager.deleteProject({ did: appDid, projectId: blockletDid }, context);
    expect(fs.existsSync(path.join(dataDir, '.projects', blockletDid))).toBe(false);
    expect(await manager.getProjects({ did: appDid }, context)).toEqual({ projects: [] });

    await manager.createProject({ did: appDid, type: 'resource', blockletDid, blockletTitle: 'demo1' }, context);

    // selected resources
    const tmpSelectedResourceFile = path.join(
      dataDir,
      '.projects',
      blockletDid,
      'resource',
      '.component_config',
      `${staticDemoDid}.json`
    );

    expect(fs.existsSync(tmpSelectedResourceFile)).toBe(false);
    await manager.updateSelectedResources(
      {
        did: appDid,
        projectId: blockletDid,
        componentDid: staticDemoDid,
        resources: ['id1', 'id2', 'id3'],
      },
      context
    );
    expect(fs.existsSync(tmpSelectedResourceFile)).toBe(true);
    const r0 = await manager.createRelease(
      {
        did: appDid,
        projectId: blockletDid,
        blockletVersion: '1.0.0',
        status: 'draft',
        blockletTitle: 'demo2',
        blockletDescription: 'demo2 desc',
      },
      context
    );
    expect(fs.existsSync(tmpSelectedResourceFile)).toBe(false);
    const { releases } = await manager.getReleases({ did: appDid, projectId: blockletDid }, context);
    expect(releases.length).toBe(1);
    expect(releases[0].blockletVersion).toBe('1.0.0');
    expect(releases[0].blockletTitle).toBe('demo2');
    expect(releases[0].id).toEqual(expect.any(String));
    expect(releases[0].status).toBe('draft');
    expect(releases[0].blockletDescription).toBe('demo2 desc');

    const r1 = await manager.getRelease({ did: appDid, projectId: blockletDid, releaseId: r0.id }, context);
    expect(r1.blockletVersion).toBe('1.0.0');
    expect(r1.blockletTitle).toBe('demo2');
    expect(r1.status).toBe('draft');
    expect(releases[0].blockletDescription).toBe('demo2 desc');

    // should fork info release to project draft
    const p3 = await manager.getProject({ did: appDid, projectId: blockletDid }, context);
    expect(p3.blockletDescription).toBe('demo2 desc');

    await fs.ensureDir(
      path.join(dataDir, '.projects', blockletDid, 'releases', r0.id, 'resource', 'not-valid-did', 'page')
    );

    await expect(
      manager.createRelease(
        {
          did: appDid,
          projectId: blockletDid,
          releaseId: r0.id,
          blockletVersion: '1.0.0',
          status: 'published',
          blockletTitle: 'demo2',
          blockletDescription: 'demo2 desc xx',
          note: 'release 1.0.0',
        },
        context
      )
    ).rejects.toThrow('did is invalid');

    await fs.remove(
      path.join(dataDir, '.projects', blockletDid, 'releases', r0.id, 'resource', 'not-valid-did', 'page')
    );
    await fs.ensureDir(
      path.join(
        dataDir,
        '.projects',
        blockletDid,
        'releases',
        r0.id,
        'resource',
        'z2qa79etNmLMG9EDdzrAgDe6FQfLonToJQsf2',
        'page'
      )
    );

    await manager.createRelease(
      {
        did: appDid,
        projectId: blockletDid,
        releaseId: r0.id,
        blockletVersion: '1.0.0',
        status: 'published',
        blockletTitle: 'demo2',
        blockletDescription: 'demo2 desc',
        note: 'release 1.0.0',
      },
      context
    );
    const r2 = await manager.getRelease({ did: appDid, projectId: blockletDid, releaseId: r0.id }, context);
    expect(r2.blockletVersion).toBe('1.0.0');
    expect(r2.blockletTitle).toBe('demo2');
    expect(r2.status).toBe('published');
    expect(r2.blockletDescription).toBe('demo2 desc');
    expect(r2.note).toBe('release 1.0.0');

    const selectedResourceFile = path.join(
      dataDir,
      '.projects',
      blockletDid,
      'releases',
      r0.id,
      'resource',
      '.component_config',
      `${staticDemoDid}.json`
    );
    expect(fs.readJSONSync(selectedResourceFile)).toEqual(['id1', 'id2', 'id3']);
    await manager.updateSelectedResources(
      {
        did: appDid,
        projectId: blockletDid,
        releaseId: r0.id,
        componentDid: staticDemoDid,
        resources: ['id4', 'id5', 'id6'],
      },
      context
    );
    expect(fs.readJSONSync(selectedResourceFile)).toEqual(['id4', 'id5', 'id6']);
    expect(fs.existsSync(tmpSelectedResourceFile)).toBe(false);

    // cannot update published release
    await expect(
      manager.createRelease(
        {
          did: appDid,
          projectId: blockletDid,
          releaseId: r0.id,
          blockletVersion: '1.0.0',
          status: 'published',
          blockletTitle: 'demo2',
          blockletDescription: 'demo2 desc xx',
          note: 'release 1.0.0',
        },
        context
      )
    ).rejects.toThrow();

    expect(fs.existsSync(path.join(dataDir, '.projects', blockletDid, 'releases', r0.id))).toBe(true);

    await manager.deleteRelease({ did: appDid, projectId: blockletDid, releaseId: r0.id });
    expect(fs.existsSync(path.join(dataDir, '.projects', blockletDid, 'releases', r0.id))).toBe(false);
    expect((await manager.getReleases({ did: appDid, projectId: blockletDid }, context)).releases.length).toBe(0);

    // publish blocklet without Resources
    const r3 = await manager.createRelease(
      {
        did: appDid,
        projectId: blockletDid,
        blockletVersion: '1.0.1',
        status: 'draft',
        blockletTitle: 'demo2',
        blockletDescription: 'demo2 desc',
      },
      context
    );
    await expect(
      manager.createRelease(
        {
          did: appDid,
          projectId: blockletDid,
          releaseId: r3.id,
          blockletVersion: '1.0.0',
          status: 'published',
          blockletTitle: 'demo2',
          blockletDescription: 'demo2 desc xx',
          note: 'release 1.0.1',
        },
        context
      )
    ).resolves.toBeTruthy();

    const r3ResourceDir = path.join(dataDir, '.projects', blockletDid, 'releases', r3.id, 'resource');
    expect(fs.readdirSync(r3ResourceDir).length).toBe(0);
  });

  afterAll(async () => {
    await tearDownInstance(instance);
  });
});
