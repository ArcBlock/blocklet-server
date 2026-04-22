/* eslint-disable no-console */
const assert = require('assert');
const { default: axios } = require('axios');
const url = require('url');
const stringify = require('json-stable-stringify');
const Mcrypto = require('@ocap/mcrypto');
const { proofTypes, create: createVC } = require('@arcblock/vc');
const Jwt = require('@arcblock/jwt');
const { toBase58, toBase64 } = require('@ocap/util');
const { fromRandom, fromSecretKey } = require('@ocap/wallet');
const { VC_TYPE_GENERAL_PASSPORT, VC_TYPE_NODE_PASSPORT } = require('@abtnode/constant');

const getStartPoint = deepLink => {
  const parsed = url.parse(deepLink, true);
  return decodeURIComponent(parsed.query.url);
};

const createServerPassportPresentation = async ({ claim, server, wallet, challenge, user }) => {
  const vc = stringify(
    await createVC({
      type: [VC_TYPE_GENERAL_PASSPORT, VC_TYPE_NODE_PASSPORT, 'VerifiableCredential'],
      issuer: {
        wallet: server,
        name: 'Blocklet Server',
      },
      subject: {
        id: wallet.address,
        passport: { name: user, title: user },
      },
    })
  );
  const presentation = {
    '@context': ['https://schema.arcblock.io/v0.1/context.jsonld'],
    challenge,
    type: proofTypes[Mcrypto.types.KeyType.ED25519], // holder wallet pk type
    verifiableCredential: [vc],
  };

  presentation.proof = {
    type: proofTypes[Mcrypto.types.KeyType.ED25519], // holder wallet pk type,
    created: new Date().toISOString(),
    proofPurpose: 'assertionMethod',
    pk: toBase58(wallet.publicKey),
    jws: toBase64(await wallet.sign(stringify(presentation))),
  };

  claim.presentation = stringify(presentation);
  claim.assetDid = ''; // FIXME what is assetDid

  return claim;
};

const getKeyPairClaim = sk => {
  const type = { role: Mcrypto.types.RoleType.ROLE_APPLICATION };
  const wallet = sk ? fromSecretKey(sk, type) : fromRandom(type);
  return {
    type: 'keyPair',
    description: 'Please create keyPair',
    moniker: 'e2e-test-application',
    secret: toBase58(wallet.secretKey),
    userDid: wallet.address,
    userPk: toBase58(wallet.publicKey),
  };
};

const config = {
  owner: {
    walletFnName: 'getOwnerWallet',
    profileFnName: 'getOwnerProfile',
  },
  admin: {
    walletFnName: 'getAdminWallet',
    profileFnName: 'getAdminProfile',
  },
};

const doConnect = async (authUrl, wallet, label) => {
  let obj = new URL(authUrl);
  obj.searchParams.set('user-agent', 'ArcWallet/4.0.0');

  const { data: info3 } = await axios.get(obj.href);
  assert.equal(await Jwt.verify(info3.authInfo, info3.appPk), true);
  const authInfo1 = Jwt.decode(info3.authInfo);
  console.log(`${label}.step1: get requested claim`, authInfo1);

  // 2. submit auth principal
  let claims = authInfo1.requestedClaims;
  let nextUrl = obj.href;
  let challenge = authInfo1.challenge; // eslint-disable-line
  if (claims.find(x => x.type === 'authPrincipal')) {
    obj = new URL(authInfo1.url);
    obj.searchParams.set('user-agent', 'ArcWallet/4.0.0');
    const { data: info5 } = await axios.post(obj.href, {
      userPk: toBase58(wallet.publicKey),
      userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
        requestedClaims: [],
        challenge: authInfo1.challenge,
      }),
    });
    const authInfo2 = Jwt.decode(info5.authInfo);
    console.log(`${label}.step2: submit auth principal`, authInfo2);
    claims = authInfo2.requestedClaims;
    challenge = authInfo2.challenge;
    nextUrl = authInfo2.url;
  }

  return { claims, nextUrl, challenge };
};

Cypress.Commands.add('getAuthUrl', () => {
  cy.wait(1000);
  cy.waitUntil(
    () =>
      cy
        .get('[data-did-auth-url]')
        .invoke('attr', 'data-did-auth-url')
        .then(value => {
          return value && value.length > 0;
        }),
    {
      timeout: 10000, // 最长等待 10 秒
      interval: 500, // 每 500ms 检查一次
    }
  );
  cy.get('[data-did-auth-url]', { timeout: 6000 }).then(x => {
    const deepLink = x.get(0).getAttribute('data-did-auth-url');
    const authUrl = getStartPoint(deepLink);
    console.log('getAuthUrl', authUrl);
    return authUrl;
  });
});

Cypress.Commands.add('claim', (user = 'owner') => {
  const { walletFnName, profileFnName } = config[user];

  cy.getAuthUrl().then(authUrl => {
    cy[walletFnName]().then(wallet => {
      cy[profileFnName]().then(async profile => {
        const { claims, nextUrl, challenge } = await doConnect(authUrl, wallet, 'claim');
        // 4. submit requested claims
        const { origin } = claims.find(x => x.type === 'signature');
        const sig = await wallet.sign(origin);
        const { data: info7 } = await axios.post(nextUrl, {
          userPk: toBase58(wallet.publicKey),
          userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
            requestedClaims: [
              { type: 'profile', ...profile },
              { type: 'signature', origin, sig },
            ],
            challenge,
          }),
        });
        const authInfo3 = Jwt.decode(info7.authInfo);
        console.log('claim.step3: submit profile info', authInfo3);

        cy.wait(2000);
      });
    });
  });
});

Cypress.Commands.add('login', (user = 'owner', { provideVC = true } = {}) => {
  const { walletFnName, profileFnName } = config[user];

  cy.session(
    [user, provideVC],
    () => {
      cy.visit('/dashboard');
      cy.getNodeWallet().then(nodeWallet => {
        cy.getAuthUrl().then(authUrl => {
          cy[walletFnName]().then(wallet => {
            cy[profileFnName]().then(async profile => {
              const { claims, nextUrl, challenge } = await doConnect(authUrl, wallet, 'login');
              let claim = claims.find(x => x.type === 'verifiableCredential');
              if (provideVC) {
                claim = await createServerPassportPresentation({
                  claim,
                  server: nodeWallet,
                  wallet,
                  challenge,
                  user,
                });
              }

              const { data: info7 } = await axios.post(nextUrl, {
                userPk: toBase58(wallet.publicKey),
                userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
                  requestedClaims: [{ type: 'profile', ...profile }, { ...claim }],
                  challenge,
                }),
              });
              const authInfo3 = Jwt.decode(info7.authInfo);
              console.log('login.step3: submit profile info', authInfo3);

              cy.wait(1000);
            });
          });
        });
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.getLocalStorage('__sst').should('exist');
      },
    }
  );
});

Cypress.Commands.add('authByVC', (user = 'owner') => {
  const { walletFnName } = config[user];

  cy.getNodeWallet().then(nodeWallet => {
    cy.getAuthUrl().then(authUrl => {
      cy[walletFnName]().then(async wallet => {
        const { claims, nextUrl, challenge } = await doConnect(authUrl, wallet, 'authByVC');
        const vcClaim = claims.find(x => x.type === 'verifiableCredential');

        const claim = await createServerPassportPresentation({
          claim: vcClaim,
          server: nodeWallet,
          wallet,
          challenge,
          user,
        });

        const { data: info7 } = await axios.post(nextUrl, {
          userPk: toBase58(wallet.publicKey),
          userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
            requestedClaims: [{ ...claim }],
            challenge,
          }),
        });
        const authInfo3 = Jwt.decode(info7.authInfo);
        console.log('login.step3: submit vc info', authInfo3);

        cy.wait(1000);
      });
    });
  });
});

Cypress.Commands.add('logout', () => {
  cy.getLocalStorage('__sst').then(token => {
    if (token) {
      cy.log('login token', token);
      cy.get('[data-cy="sessionManager-logout-popup"]').click({ force: true });
      cy.get('[data-cy="sessionManager-logout-trigger"]').click({ force: true });
    } else {
      cy.wait(10);
    }
  });
});

Cypress.Commands.add('switchProfile', (user = 'owner') => {
  const { walletFnName, profileFnName } = config[user];

  cy.getAuthUrl().then(authUrl => {
    cy[walletFnName]().then(wallet => {
      cy[profileFnName]().then(async profile => {
        const { nextUrl, challenge } = await doConnect(authUrl, wallet, 'switch-profile');
        const { data: info7 } = await axios.post(nextUrl, {
          userPk: toBase58(wallet.publicKey),
          userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
            requestedClaims: [{ type: 'profile', ...profile }],
            challenge,
          }),
        });
        const authInfo3 = Jwt.decode(info7.authInfo);
        console.log('switch-profile.step3: submit profile info', authInfo3);

        cy.wait(1000);
      });
    });
  });
});

Cypress.Commands.add('switchPassport', (user = 'owner') => {
  const { walletFnName } = config[user];
  cy.getNodeWallet().then(nodeWallet => {
    cy.getAuthUrl().then(authUrl => {
      cy[walletFnName]().then(async wallet => {
        const { claims, nextUrl, challenge } = await doConnect(authUrl, wallet, 'switch-passport');

        let claim = claims.find(x => x.type === 'verifiableCredential');
        claim = await createServerPassportPresentation({
          claim,
          server: nodeWallet,
          wallet,
          challenge,
          user,
        });

        const { data: info7 } = await axios.post(nextUrl, {
          userPk: toBase58(wallet.publicKey),
          userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
            requestedClaims: [{ ...claim }],
            challenge,
          }),
        });
        const authInfo3 = Jwt.decode(info7.authInfo);
        console.log('switch-passport.step3: submit passport info', authInfo3);

        cy.wait(1000);
      });
    });
  });
});

Cypress.Commands.add('authByVCAndKeyPair', ({ user = 'owner', appSk } = {}) => {
  const { walletFnName } = config[user];

  cy.getNodeWallet().then(nodeWallet => {
    cy.getAuthUrl().then(authUrl => {
      cy[walletFnName]().then(async wallet => {
        const { claims, nextUrl, challenge } = await doConnect(authUrl, wallet, 'authByVCAndKeyPair');
        const vcClaim = claims.find(x => x.type === 'verifiableCredential');

        const claim = await createServerPassportPresentation({
          claim: vcClaim,
          server: nodeWallet,
          wallet,
          challenge,
          user,
        });

        const { data: info7 } = await axios.post(nextUrl, {
          userPk: toBase58(wallet.publicKey),
          userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
            requestedClaims: [{ ...claim }, getKeyPairClaim(appSk)],
            challenge,
          }),
        });
        const authInfo3 = Jwt.decode(info7.authInfo);
        console.log('login.step3: submit vc and keyPair info', authInfo3);

        cy.wait(1000);
      });
    });
  });
});

Cypress.Commands.add('authByKeyPair', ({ user = 'owner', appSk } = {}) => {
  const { walletFnName } = config[user];

  cy.getAuthUrl().then(authUrl => {
    cy[walletFnName]().then(async wallet => {
      const { nextUrl, challenge } = await doConnect(authUrl, wallet, 'authByKeyPair');

      const { data: info7 } = await axios.post(nextUrl, {
        userPk: toBase58(wallet.publicKey),
        userInfo: await Jwt.sign(wallet.address, wallet.secretKey, {
          requestedClaims: [getKeyPairClaim(appSk)],
          challenge,
        }),
      });
      const authInfo3 = Jwt.decode(info7.authInfo);
      console.log('login.step3: submit keyPair info', authInfo3);

      cy.wait(1000);
    });
  });
});
