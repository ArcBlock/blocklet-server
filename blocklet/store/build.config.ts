import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  sourcemap: true,
  failOnWarn: false,
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
