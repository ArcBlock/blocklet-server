import type { GitHooksConfig } from 'bun-git-hooks';

const config: GitHooksConfig = {
  'pre-commit': 'bun run pre-commit',
  'verbose': false,
};

export default config;
