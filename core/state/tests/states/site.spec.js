const SiteState = require('../../lib/states/site');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('SiteState', () => {
  let state = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    state = new SiteState(models.Site, {});
  });

  afterEach(async () => {
    await state.reset();
  });

  test('should throw error if validate failed', () => {
    expect(state.updateDomainAliasList('test')).rejects.toThrow();
    expect(state.updateDomainAliasList('test', 'a')).rejects.toThrow();
    expect(state.updateDomainAliasList('test', [{ a: 1 }])).rejects.toThrow();
  });

  test('should work as expected', async () => {
    let site = await state.add({ domain: 'blocklet1.blocklet-domain-group' });
    expect(site).toBeTruthy();

    let result = await state.addRuleToSite(site.id, {
      id: 'rule1',
      from: { pathPrefix: '/prefix' },
      to: { did: 'blocklet1' },
    });
    expect(result).toBeTruthy();

    let sites = await state.getSites();
    expect(sites.find((x) => x.id === site.id)).toBeTruthy();

    sites = await state.getSitesByBlocklet('blocklet1');
    expect(sites.find((x) => x.id === site.id)).toBeTruthy();

    const rule = await state.getRuleById('rule1');
    expect(rule).toBeTruthy();

    const domainAliases = [{ value: 'arc.com', isProtected: true }];
    await state.updateDomainAliasList(site.id, domainAliases);

    const newSite = await state.findOne({ id: site.id });
    expect(newSite.domainAliases).toEqual(domainAliases);

    let exist = await state.domainExists('blocklet1.blocklet-domain-group');
    expect(exist).toBeTruthy();

    exist = await state.domainExists('arc.com');
    expect(exist).toBeTruthy();

    site = await state.findOneByBlocklet('blocklet1');
    expect(site).toBeTruthy();

    const domains = await state.getBlockletDomains('blocklet1');
    expect(domains).toEqual(['arc.com']);

    result = await state.updateDomainAliasList(site.id, [{ value: 'test.com', isProtected: false }]);
    exist = await state.domainExists('test.com');
    expect(exist).toBeTruthy();
    exist = await state.domainExists('arc.com');
    expect(exist).toBeFalsy();
  });
});
