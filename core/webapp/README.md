# Blocklet Server Web

> Web Dashboard to manage Blocklet Server

## Blocklet Server Development

### Start Blocklet Server Develop Environment

1. create `.env.development` file, in the current(core/webapp) directory
2. copy follow texts to `.env.development`, change `ABT_NODE_BASE_URL` to your local lan ip

```ini
# CAUTION: this is required to eliminate create-react-scripts complainings
SKIP_PREFLIGHT_CHECK=true

# e.g. /Users/bob/<project-path>/.blocklet-server server 任意的本地目录，建议设置到项目根目录下的 .blocklet-server 目录
ABT_NODE_DATA_DIR="<SERVER DATA DIR>"

ABT_NODE_SESSION_SECRET="49bcf865c77a15993d87245b124bbc5125d2c3997437d1fda3"
ABT_NODE_SESSION_TTL="1d"
# Please use the following code to generate SK yourself
# const { fromRandom } = require('@ocap/wallet')
# const ABT_NODE_SK = fromRandom().secretKey;
ABT_NODE_SK="<ABT_NODE_SK>"
ABT_NODE_PORT="3030"
ABT_NODE_MODE="production"
ABT_NODE_NAME="Blocklet Server (Dev)"
ABT_NODE_DESCRIPTION="Web Interface to manage your Blocklet Server"
# e.g. http://192.168.1.2:3030 如果登录的时候无法扫码,请检查该设置
ABT_NODE_BASE_URL="http://<YOUR LOCAL LAN IP>:3030"

# 如果只想看 error 日志，设置 ABT_NODE_LOG_LEVEL 为 "error"
ABT_NODE_LOG_LEVEL="info"

# 关闭 SQLITE 日志。如果想查看 SQLITE 日志请注释掉 DISABLE_SQLITE_LOG
DISABLE_SQLITE_LOG=1

# 如果我们不需要调试 npm run start:service 对应的前端的时候,修改该配置为空
ABT_NODE_SERVICE_FE_PORT="3040"

# 如果想要以serverless 执行调试serverless jobs，就配置为true
ABT_NODE_DEBUG_AS_SERVERLESS = "false"

```

3. Start the client and server

```shell

# if you are not in the core/webapp directory
cd core/webapp

# Option 1
# use the 4 terminal windows to start it with separately

# terminal.0 => database && message queue
npm run start:hub
# terminal.1 => server daemon
npm run start:daemon
# terminal.2 => blocklet service
npm run start:service
# terminal.3 => server dashboard
npm run start:client


# Option 2
# quickly start
npm run start

# After the development is completed, you can use `npm run stop` to completely terminate all the processes.
npm run stop
```

Now, you are ready to hacking the Blocklet Server.

##### Start blocklet-service client Develop Environment

If you want to develop blocklet service client, additional action you need to do

1. Set `ABT_NODE_SERVICE_FE_PORT="3040"` in `.env.development`
2. Start the client and server as same as above
3. Start Blocklet Service Client
4. If you are adding new pages to blocklet-service, please remember to clear service-worker cache in browser

```shell
cd core/blocklet-services
DEBUG=@abtnode/* npm run start:client
```

## How to run as production from your local source?

> Following steps requires you have a valid setup of the repo, which means you can start the dashboard in development mode.

### Build the dashboard

```shell
cd core/webapp && npm run build:client && npm run build:daemon
```

### Create symbolic link for CLI

```shell
ln -s /path/to/blocklet-server-repo/core/cli/bin/blocklet.js /usr/local/bin/bn
```

### Run your local copy

```shell
# optional: create a new instance for test
cd /path/to/your-empty-folder
bn server init

# start with latest code
bn server start
```

If your local nginx can not listen on port 80 and port 443, you can make it listen on other ports:

```shell
ABT_NODE_HTTP_PORT=8080 ABT_NODE_HTTPS_PORT=8443 an start
```

Then, use port forwarding to redirect traffic from 80 => 8080, and 443 => 8443:

```shell
echo "
rdr pass inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080
rdr pass inet proto tcp from any to any port 443 -> 127.0.0.1 port 8443
" | sudo pfctl -ef -
```

### Run E2E test

```shell
# in core/webapp directory
yarn test:e2e
```

### Coverage

Coverage for this package contains 3 parts:

- api: collected using jest, configured in `jest.config.js`, result in `coverage-api`
- src: collected using react-script, configured in `jest` in `package.json`, result in `coverage`
- e2e: collected using cypress, configured in `nyc` in `package.json`, result in `coverage-e2e`

### Develop blocklet in dev server

0. Make sure your dev server is running

1. Goto blocklet root dir
2. Run command `<blocklet-server-source-dir>/core/cli/tools/dev.js` (Replace `<blocklet-server-source-dir>` to your custom folder)

Create a link for dev.js

1. Run command `ln -s <blocklet-server-source-dir>/core/cli/tools/dev.js /usr/local/bin/bn-dev`
2. Then you can use `bn-dev` to develop blocklet in dev server

### Deploy blocklet to dev server

1. Create an access key pair in Server Dashboard
2. Goto blocklet root dir
3. Bundle your blocklet
4. Deploy to dev server: `bn deploy .blocklet/bundle --endpoint http://127.0.0.1:3030 --access-key <your-access-key> --access-secret <your-access-secret>`

### Run migration for dev server

```shell
cd core/webapp && npm run dev:migration -- --from-version <version>
```

e.g. `npm run dev:migration -- --from-version 1.6.20` will run migration scripts greater than 1.6.20

### Working with ux repo hmr

Add `ARCBLOCK_UX_BASE_PATH` equals to your ux repo path in `.env.development` file

```shell
ARCBLOCK_UX_BASE_PATH="/Users/xxx/arcblock/ux"
```

Then, you can change ux repo src code to see hmr effect in blocklet-server webapp

### FAQ

Q: Receive `URLSessionTask failed with error` when connecting to Dev Server with iOS wallet or Android wallet

A: If `ABT_NODE_BASE_URL` exists in you .env, .env.development or .env.development.local, make sure the value of `ABT_NODE_BASE_URL` is your local lan IP

Q: If the Cornerstone application interface shows that the application is running when debugging locally, and when you click the Cornerstone application **open** button you are redirected to the proxy failure screen, or to the code installation screen, or to the blocklet screen with `404` or `502` errors, please refer to the following solutions

A:

Solution 1: Close blocklet-services client && delete env ABT_NODE_SERVICE_FE_PORT && restart the blocklet-service process: go to the webapp directory and execute the script `npm run start:service`

Solution 2: Close all blocklet-server related development processes, run npm run deep-clean, and restart all blocklet-server development processes.
