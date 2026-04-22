# Core Schema

Defines data structure for ABT Node backend API, and maintains schema for GQL endpoint.

## Build schema<a name="build-schema"></a>

You can choose one of the following two ways to build schema.
It is recommended to build with Docker.

### Option 1. Build schema with Docker

Requirements:

- Docker

```bash
docker pull arcblock/blocklet-server-proto
docker run --rm -v {absolute path of core/schema}:/home/root/schema arcblock/blocklet-server-proto
```

### Option 2. Build schema with Go

Requirements:

- go 1.8+

#### Install go

- Mac: brew install go
- Other platform: https://go.dev/doc/install

```shell
# you can use `go env` to check the go environment
go env

```

#### Install gnu-sed(MacOS)

```bash
# Install(Mac OS), other platform: https://www.gnu.org/software/sed/
brew install gnu-sed
# Make `sed` command work, only for homebrew:
PATH="$(brew --prefix)/opt/gnu-sed/libexec/gnubin:$PATH"
```

#### Install protobuf

- Mac: brew install protobuf
- Other platform: https://developers.google.com/protocol-buffers/docs/downloads

#### Add to `~/.profile`

```shell

vim ~/.profile

# add the profile to the end of the file
# ----------------------------------------------------------

export GO111MODULE=on
export GOPROXY=https://goproxy.cn

# you can query the GOROOT/GOPATH/GOBIN by `go env`
export GOROOT=/usr/local/Cellar/go/1.15.5/libexec // replace to your local go path
export GOPATH=$HOME/.golang
export GOBIN=$GOPATH/bin
export PATH=$PATH:$GOROOT:$GOPATH:$GOBIN

# ----------------------------------------------------------

source ~/.profile

```

#### Install other dependencies

Run `make init`

> If there is a network problem, try to change golang registry by https://goproxy.cn/

#### Build Schema

Make sure you're in the `core/schema` directory, run `make build`

## How To Update Schema

### Option 1: Manually execute step by step

### Prerequisites

Ensure that core/schema has been built, please see [here](#build-schema).

> If you are using mac, you may need replace the `sed` command with `gsed`

### 1. go to core/webapp start a demo endpoint

just run：

```shell
npm run open:gql
```

> should make sure the DB Proxy is running, if not, run `yarn start` in a new terminal

### 2. go to core/client do finally update

just run:

```shell
npm run upgrade
```

### 3. finish the update

### Option 2: Use command line

In the root directory of the project, run:

```shell
npm run update:schema
```

The execution steps of this command are as follows:

- Step 1: Execute 'make build' in the 'core/schema' directory
- Step 2: Execute 'npm run open:gql' in the 'core/webapp' directory
- Step 3: Execute 'npm run upgrade' in the 'core/client' directory
- Step 4: Terminate the process started in Step 2
