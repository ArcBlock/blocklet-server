# core/models

## 开发流程

- 1. 修改 `core/models` 下的任何信息后（比如新增字段，新增表)，需要执行 `npm run build`(注意，某些时候 blocklet, server 的迁移脚本都需要写)
- 2. 在 `core/schema` 下，修改接口的返回字段
- 3. 为了生成 `core/types` 类型，你还需要在项目的根目录下执行 `npm run update:schema`
- 4. 在 `core/models` 使用 `core/types` 的 typescript 类型
- 5. 在 `core/webapp` 下面执行 ` node tools/dev-migration.js`(如果是 make build 起来之后，需要执行 `node tools/migrate-schema.js`)