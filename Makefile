TOP_DIR=.
README=$(TOP_DIR)/README.md

VERSION=$(strip $(shell cat version))

build-services:
	@echo "Building blocklet-services..."
	@cd core/blocklet-services && npm run build

build-webapp:
	@echo "Building webapp..."
	@cd core/webapp && npm run build

build:
	@echo "Building the software..."
	@bun install
	@make dep-lite
	@make -j2 build-services build-webapp
	@echo "Local Blocklet Server and services are successfully built..."

build-webapp-client:
	@echo "Building webapp client..."
	@cd core/ux && npm run build
	@cd core/webapp && npm run build:client

# Build the software using turbo build dependencies and use npm run build client and daemon
turbo-build:
	@echo "Building the software..."
	@bun install
	@npm run turbo:dep
	@npm run build:migration-scripts
	@make -j2 build-services build-webapp
	@echo "Local Blocklet Server and services are successfully built..."

build-debug:
	@echo "Building the software..."
	@bun install
	@make dep-lite
	@make build-webapp
	@cd core/webapp && npm run build-daemon-debug
	@echo "Local DEBUG Blocklet Server is successfully built..."

init: install dep
	@echo "Initializing the repo..."
	@make build-services

github-init:
	@echo "Initialize software required for github (normally ubuntu software)"
	@make install
	@make dep
	@rm -rf .git/hooks

ci-nginx:
	@bash ./tools/setup-nginx-on-ci.sh

install:
	@echo "Install software required for this repo..."
	@npm install -g lerna bun

dep:
	@echo "Install dependencies required for this repo..."
	# If you are experiencing issues when installing cypress, use following commented lines
	# @wget https://releases.arcblockio.cn/cypress.zip -o /tmp/cypress.zip
	# @export CYPRESS_INSTALL_BINARY=/tmp/cypress.zip && lerna bootstrap
	@bun install
	@node tools/patch-dependencies.js
	@make dep-lite

dep-lite:
	# Install dependencies without build client of blocklet-services
	@cd core/db-cache && npm run build
	@cd core/docker-utils && npm run build
	@cd core/constant && npm run build
	@cd blocklet/constant && npm run build
	@cd blocklet/images && npm run build
	@cd core/client && npm run build
	@cd blocklet/meta && npm run build
	@cd core/ux && npm run build
	@cd blocklet/env && npm run build
	@cd blocklet/node-sdk && npm run build
	@cd blocklet/js-sdk && npm run build
	@cd blocklet/rate-limit && npm run build
	@cd blocklet/store && npm run build
	@cd core/models && npm run build
	@cd core/blocklet-services && npm run build:email
	@cd blocklet/resolver && npm run build
	@cd core/analytics && npm run build
	@npm run build:migration-scripts

pre-build: install dep
	@echo "Running scripts before the build..."

post-build:
	@echo "Running scripts after the build is done..."

all: pre-build build post-build

test:
	@echo "Running test suites..."
	@npm run turbo:test

coverage:
	@echo "Running test suites and collecting coverage..."
	@npm run coverage


doc:
	@echo "Building the documentation..."

lint:
	@echo "Building the documentation..."
	@npm run turbo:lint

clean:
	@echo "Cleaning the build..."

run:
	@echo "Running the software..."

include .makefiles/*.mk

.PHONY: build init travis-init install dep pre-build post-build all test doc travis clean run bump-version create-pr
