const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { switchProfile, switchPassport, login } = require('../../libs/connect/session');
const initJwt = require('../../libs/jwt');

module.exports = {
  init(server, node, options) {
    const prefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/connect/relay`;

    // api for login
    server.post(`${prefix}/login/connect`, async (req, res) => {
      try {
        const { locale, currentConnected } = req.body;
        const claim = await login.onConnect({
          node,
          request: req,
          locale,
          userDid: currentConnected.userDid,
          userPk: currentConnected.userPk,
          passportId: req.query.passportId || '',
        });
        res.json([[claim.profile, claim.verifiableCredential].filter(Boolean)]);
      } catch (err) {
        console.error(err);
        res.json({ error: err.message });
      }
    });
    server.post(`${prefix}/login/approve`, async (req, res) => {
      try {
        const { locale, currentStep, challenge, authUrl, currentConnected, responseClaims } = req.body;
        const { createSessionToken } = initJwt(node, options);
        const result = await login.onApprove({
          node,
          request: req,
          locale,
          challenge,
          claims: responseClaims[currentStep],
          userDid: currentConnected.userDid,
          userPk: currentConnected.userPk,
          baseUrl: new URL(authUrl).origin,
          createSessionToken,
        });
        res.json(result);
      } catch (err) {
        console.error(err);
        res.json({ error: err.message });
      }
    });

    // api for switch profile
    server.post(`${prefix}/switch-profile/connect`, async (req, res) => {
      try {
        const { locale, currentConnected, previousConnected } = req.body;
        const claim = await switchProfile.onConnect({
          node,
          request: req,
          locale,
          userDid: currentConnected.userDid,
          previousUserDid: previousConnected?.userDid,
        });
        res.json([[{ type: 'profile', ...claim.profile }]]);
      } catch (err) {
        console.error(err);
        res.json({ error: err.message });
      }
    });
    server.post(`${prefix}/switch-profile/approve`, async (req, res) => {
      try {
        const { locale, currentConnected, responseClaims, currentStep } = req.body;
        const result = await switchProfile.onApprove({
          node,
          request: req,
          locale,
          profile: responseClaims[currentStep].find((x) => x.type === 'profile'),
          userDid: currentConnected.userDid,
        });
        res.json(result);
      } catch (err) {
        console.error(err);
        res.json({ error: err.message });
      }
    });

    // api for switch passport
    server.post(`${prefix}/switch-passport/connect`, async (req, res) => {
      try {
        const { locale, currentConnected, previousConnected } = req.body;
        const claim = await switchPassport.onConnect({
          node,
          request: req,
          locale,
          userDid: currentConnected.userDid,
          previousUserDid: previousConnected?.userDid,
        });
        res.json([[{ type: 'verifiableCredential', ...claim.verifiableCredential }]]);
      } catch (err) {
        console.error(err);
        res.json({ error: err.message });
      }
    });
    server.post(`${prefix}/switch-passport/approve`, async (req, res) => {
      try {
        const { locale, currentConnected, responseClaims, challenge, currentStep } = req.body;
        const { createSessionToken } = initJwt(node, options);
        const { sessionToken, refreshToken } = await switchPassport.onApprove({
          node,
          request: req,
          locale,
          challenge,
          verifiableCredential: responseClaims[currentStep].find((x) => x.type === 'verifiableCredential'),
          userDid: currentConnected.userDid,
          createSessionToken,
        });
        res.json({ sessionToken, refreshToken });
      } catch (err) {
        console.error(err);
        res.json({ error: err.message });
      }
    });
  },
};
