const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const flatten = require('lodash/flatten');
const { joinURL } = require('ufo');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  init(app, node, options) {
    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/openevent.json`, async (req, res) => {
      try {
        const [blocklet, info] = await Promise.all([req.getBlocklet(), req.getBlockletInfo()]);
        if (!blocklet) {
          res.status(404).json({ error: 'Blocklet not found' });
          return;
        }

        const components = (blocklet?.children || []).filter(
          (x) => Array.isArray(x.meta.events) && x.meta.events.length > 0
        );
        const appUrl = blocklet?.environmentObj?.BLOCKLET_APP_URL;
        const baseUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet');

        const globalEvents = [
          {
            type: 'blocklet.user.added',
            description: 'When a new user has onboarded, will receive the user info object',
          },
          {
            type: 'blocklet.user.updated',
            description: 'When a user has updated/logged in, will receive the user info object',
          },
          {
            type: 'blocklet.user.removed',
            description: 'When a user has removed, will receive the user did',
          },
          {
            type: 'blocklet.user.profile.updated',
            description: 'When a user has updated his/her profile (full name, avatar, did-spaces, etc.)',
          },
          {
            type: 'blocklet.user.permission.updated',
            description: 'When a user permission (passport, account, kyc) has changed',
          },
        ];

        const data = {
          openevent: '1.0.0',
          info: {
            title: info.name,
            description: info.description,
          },
          sources: [
            {
              did: info.did,
              title: info.name,
              description: info.description,
              version: info.version,
              logo: joinURL(baseUrl, '/logo'),
            },
            ...components.map((x) => ({
              did: x.meta.did,
              title: x.meta.title,
              description: x.meta.description,
              version: x.meta.version,
              logo: joinURL(baseUrl, `/logo-bundle/${x.meta.did}?v=${info.version}`),
            })),
          ],
          events: flatten([
            ...globalEvents.map((e) => ({
              type: e.type,
              description: e.description,
              source: info.did,
            })),
            ...components.map((x) =>
              x.meta.events.map((e) => ({
                type: e.type,
                description: e.description,
                source: x.meta.did,
              }))
            ),
          ]),
        };

        res.status(200).json(data);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });
  },
};
