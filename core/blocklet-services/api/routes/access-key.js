/* eslint-disable require-await */
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { SERVER_ROLES } = require('@abtnode/constant');
const { encrypt } = require('@abtnode/util/lib/security');
const { CustomError } = require('@blocklet/error');
const uniq = require('lodash/uniq');

const logger = require('../libs/logger')();
const ensureBlocklet = require('../middlewares/ensure-blocklet');
const checkUser = require('../middlewares/check-user');

const PREFIX = WELLKNOWN_SERVICE_PATH_PREFIX;
const prefixApi = `${PREFIX}/api/access-key`;

module.exports = {
  init(server, node) {
    server.post(`${prefixApi}/authorize`, checkUser, ensureBlocklet(), async (req, res) => {
      const teamDid = req.get('x-blocklet-did');
      const requiredRoles = (req.body?.requiredRoles || '').split(',') || [];
      const user = await node.getUser({
        teamDid,
        user: { did: req.user.did },
        options: { enableConnectedAccount: true },
      });
      logger.info('authorize user', { user });
      const role = req.user?.role || '';

      let passport;
      if (requiredRoles.length > 0) {
        const passports = uniq([...(user.passports || []).map((x) => x.role), 'guest'].flat());
        const filters = requiredRoles.filter((r) => passports.includes(r));
        passport = filters?.length > 0 ? filters[0] : null;
        logger.info('authorize passport', { requiredRoles, passports, passport });
      }

      const { accessKeyId, accessKeySecret, expireAt } = await node.createAccessKey(
        {
          teamDid,
          remark: req.body.source,
          createdVia: 'connect',
          passport: passport || role.replace('blocklet-', '') || SERVER_ROLES.GUEST,
          authType: 'simple',
        },
        { user: { ...user, role } }
      );

      await node.updateSession({ id: req.body.sid, data: { accessKeyId, accessKeySecret, expireAt } });

      return res.json({ accessKeyId, expireAt });
    });

    // start session
    server.post(`${prefixApi}/session`, async (_req, res) => {
      const session = await node.startSession({ data: { type: 'access-key-simple' } });
      res.json(session);
    });

    server.get(`${prefixApi}/session`, async (req, res) => {
      const session = await node.getSession({ id: req.query.sid });
      if (session.type !== 'access-key-simple') {
        throw new CustomError(403, 'Operation session not valid');
      }

      if (session.accessKeySecret) {
        session.accessKeySecret = encrypt(session.accessKeySecret, session.accessKeyId, session.challenge);
      }

      res.json(session);
    });

    // end session
    server.delete(`${prefixApi}/session`, async (req, res) => {
      const session = await node.getSession({ id: req.query.sid });

      if (session.type !== 'access-key-simple') {
        throw new CustomError(403, 'Operation session not valid');
      }
      await node.endSession({ id: req.query.sid });

      res.json(session);
    });
  },
};
