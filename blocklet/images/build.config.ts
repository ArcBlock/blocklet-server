import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  failOnWarn: false,
  entries: ['./src/index.ts'],
  declaration: true,
});
