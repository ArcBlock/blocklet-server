import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  sourcemap: true,
  declaration: true,
  externals: [
    'redis',
    'sqlite3'
  ],
}) 