export const LOGIN_PROVIDER = {
  AUTH0: 'auth0',
  GOOGLE: 'google',
  APPLE: 'apple',
  GITHUB: 'github',
  WALLET: 'wallet',
  NFT: 'nft',
  PASSKEY: 'passkey',
  EMAIL: 'email',
  TWITTER: 'twitter',
};

export const PROVIDER_NAME = {
  auth0: 'Auth0',
  github: 'GitHub',
  google: 'Google',
  apple: 'Apple',
  email: 'Email',
  wallet: 'DID wallet',
  federated: 'Federated',
  passkey: 'Passkey',
  twitter: 'X (Twitter)',
};

export const ALLOW_VERIFY_PROVIDERS = [LOGIN_PROVIDER.PASSKEY, LOGIN_PROVIDER.WALLET];

export const OAUTH_PROVIDER_PUBLIC_FIELDS = [
  // google
  'google.enabled',
  'google.order',
  'google.type',
  // apple
  'apple.enabled',
  'apple.order',
  'apple.type',
  // github
  'github.enabled',
  'github.order',
  'github.type',
  // twitter
  'twitter.enabled',
  'twitter.order',
  'twitter.type',
  // auth0
  'auth0.domain',
  'auth0.clientId',
  'auth0.enabled',
  'auth0.order',
  'auth0.type',
];
export const BUILTIN_PROVIDER_PUBLIC_FIELDS = [
  'wallet.enabled',
  'wallet.order',
  'wallet.showQrcode',
  'wallet.type',

  'email.enabled',
  'email.order',
  'email.type',

  'passkey.enabled',
  'passkey.order',
  'passkey.type',
];
