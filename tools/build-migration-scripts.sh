#!/bin/bash

ncc build ./core/state/lib/blocklet/migration.js -o ./core/state/lib/blocklet/migration-dist

mv ./core/state/lib/blocklet/migration-dist/index.js ./core/state/lib/blocklet/migration-dist/migration.cjs


echo '
const fs = require("fs");
const path = require("path");
const runMigrationScripts = require("./migration.cjs");

let configRaw = fs
  .readFileSync(path.join(__dirname, "params-migration.json"))
  .toString();

if (
  process.env.DOCKER_HOST_SERVER_DIR &&
  process.env.DOCKER_CONTAINER_SERVER_DIR
) {
  configRaw = configRaw.replace(
    new RegExp(process.env.DOCKER_HOST_SERVER_DIR, "g"),
    process.env.DOCKER_CONTAINER_SERVER_DIR
  );
}
const inputData = JSON.parse(configRaw);

(async () => {
  await runMigrationScripts({
    ...inputData,
    env: {
      ...inputData.env,
      ...process.env,
    },
  })
  process.exit(0);
})();


' > ./core/state/lib/blocklet/migration-dist/run-script.cjs
