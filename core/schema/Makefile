SED ?= $(shell which gsed 2>/dev/null || which sed)
GEN_TS_PATH=../types/lib
PROTOC_GEN_TS_PATH="../../node_modules/.bin/protoc-gen-ts"

build:
	@echo "Building the software $(SED)..."
	@protoc --gql_out=paths=source_relative:./lib/ -I=./src/ ./src/service.proto
	@rm -f $(GEN_TS_PATH)/*.d.ts && mkdir -p $(GEN_TS_PATH)
	@protoc --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" -I=./src/ --ts_out="${GEN_TS_PATH}" ./src/*.proto
	@mv lib/service.pb.graphqls lib/schema.graphqls
	@$(SED) -i -e "/directive @/d" lib/schema.graphqls
	@$(SED) -i -e "/\"\"\"/,/\"\"\"/ d" lib/schema.graphqls
	@$(SED) -i -E "s/\(in:/\(input:/g" lib/schema.graphqls
	@$(SED) -i -E "s/query([A-Z])/\L\1\E/g" lib/schema.graphqls
	@$(SED) -i -E "s/mutation([A-Z])/\L\1\E/g" lib/schema.graphqls
	@$(SED) -i -E "s/[[:space:]]+$$//" lib/schema.graphqls   # 清理行尾空格
	@node tools/wrap.js
	@tools/types.sh
	@npx prettier --write "lib/**/*.graphqls" "$(GEN_TS_PATH)/**/*.ts"

init: install dep
	@echo "Initializing the repo..."

install:
	@echo "Install software required for this repo..."

dep:
	@echo "Install dependencies required for this repo..."
	@go install github.com/danielvladco/go-proto-gql/protoc-gen-gogqlgen@v0.7.3
	@go install github.com/danielvladco/go-proto-gql/protoc-gen-gql@v0.7.3
	@go install github.com/danielvladco/go-proto-gql/protoc-gen-gqlgencfg@v0.7.3

all: build

.PHONY: build init init install dep
