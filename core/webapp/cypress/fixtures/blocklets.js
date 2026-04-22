const blocklets = {
  staticDemo: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
  ipEchoDNS: 'z8iZuGaHf4BxN4XxFWhjuX1zP99ySPmZUFNJf',
  kitchenSinkDemo: 'z8ia22AX1PovjTi1YQw8ChgsbeVExYsX4dPFt',
  authTest: 'z8ia1CsFPeoyHFMCErmCribhZbSZn82FGRJQq',
  comingSoon: 'z8ia5AUWNBoc5Jw6Zf2ru97W1y6PZVFiFa7h9',
  blockExplorer: 'z8iZyVVn6XsvcuiYhtdw3GoasMbtqR9BjvJz3',
  launchStatic: appDid => `/launch-blocklet/agreement?blocklet_meta_url=https://store.blocklet.dev/api/blocklets/z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV/blocklet.json&appDid=${appDid}`, // prettier-ignore
  launchStaticAgreed: appDid => `/launch-blocklet/install?blocklet_meta_url=https://store.blocklet.dev/api/blocklets/z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV/blocklet.json&fromLauncher=1&appDid=${appDid}`, // prettier-ignore
  launchExplorer: '/launch-blocklet/agreement?blocklet_meta_url=https://store.blocklet.dev/api/blocklets/z8iZyVVn6XsvcuiYhtdw3GoasMbtqR9BjvJz3/blocklet.json', // prettier-ignore
};

module.exports = blocklets;
