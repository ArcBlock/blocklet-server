#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { $ } = require('zx');
const path = require('path');
const fs = require('fs-extra');
const net = require('net');
const Mcrypto = require('@ocap/mcrypto');
const { fromRandom, WalletType } = require('@ocap/wallet');

class E2EEnvironment {
  constructor() {
    this.COLORS = {
      GREEN: '\x1b[32m',
      BLUE: '\x1b[34m',
      YELLOW: '\x1b[33m',
      RED: '\x1b[31m',
      NC: '\x1b[0m',
    };

    this.args = process.argv.slice(2);
    this.CI_MODE = this.args.includes('--ci');
    this.DOCKER_MODE = this.args.includes('--docker');
    this.LOG = this.args.includes('--log');

    this.PROJECT_PATH = path.resolve(__dirname, '..');
    this.webappDir = path.join(this.PROJECT_PATH, 'core', 'webapp');
    this.cypressDir = path.join(this.webappDir, '.cypress');
    this.envVars = this.generateEnvVars();

    this.abtNodeBaseUrl = null;
    this.cli = path.join(this.PROJECT_PATH, 'core/cli/bin/blocklet.js');
  }

  /**
   * 打印带颜色的日志
   * @param {string} color 颜色代码
   * @param {string} message 消息内容
   */
  log(color, message) {
    console.log(`${this.COLORS[color]}${message}${this.COLORS.NC}`);
  }

  /**
   * 启动环境
   */
  async start() {
    this.log('BLUE', '=== Blocklet Server Development Environment Startup ===');
    this.log('YELLOW', `Project Path: ${this.PROJECT_PATH}\n`);

    this.loadEnvironmentConfig();
    await this.runStartupSequence();
  }

  /**
   * 加载环境配置
   */
  loadEnvironmentConfig() {
    const envPath = path.join(this.PROJECT_PATH, '.env.development');
    if (fs.existsSync(envPath)) {
      this.log('GREEN', 'Loading environment config: .env.development');
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        if (!line || line.startsWith('#')) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const idx = line.indexOf('=');
        if (idx > -1) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          process.env[key] = val;
        }
      }
    }
  }

  /**
   * 创建应用钱包类型配置
   * @returns {Object} 应用钱包类型配置
   */
  createAppWalletType() {
    return WalletType({
      role: Mcrypto.types.RoleType.ROLE_APPLICATION,
      pk: Mcrypto.types.KeyType.ED25519,
      hash: Mcrypto.types.HashType.SHA3,
    });
  }

  /**
   * 生成环境变量
   * @returns {Object} 环境变量对象
   */
  generateEnvVars() {
    const type = this.createAppWalletType({
      role: Mcrypto.types.RoleType.ROLE_APPLICATION,
    });
    const wallet = fromRandom(type);

    const nodeWalletFile = path.join(this.cypressDir, 'node.json');
    fs.mkdirpSync(path.dirname(nodeWalletFile), { recursive: true });
    fs.writeFileSync(nodeWalletFile, JSON.stringify(wallet.toJSON()));

    return {
      ABT_NODE_DATA_DIR: '/tmp/abtnode/e2e',
      ABT_NODE_SESSION_SECRET: wallet.publicKey,
      ABT_NODE_SK: wallet.secretKey,
      ABT_NODE_DID: wallet.address,
      ABT_NODE_PORT: '3030',
      ABT_NODE_HTTP_PORT: '80',
      ABT_NODE_HTTPS_PORT: '443',
      ABT_NODE_ROUTER_PROVIDER: 'default',
      ABT_NODE_NAME: 'ABT Node (Cypress)',
      ABT_NODE_DESCRIPTION: 'Just for E2E Test Purpose',
      DID_CONNECT_MFA_DISABLED: '1',
      TEST_UPDATE_ALL_BLOCKLET: '',
      VITE_NO_MFA_PROTECTED_METHODS: '1',
      NODE_ENV: 'e2e',
      IS_E2E: '1',
      DISABLE_SQLITE_LOG: '1',
      DISABLE_ESLINT_PLUGIN: 'true',
      BROWSER: 'none',
    };
  }

  /**
   * 执行启动序列
   */
  async runStartupSequence() {
    try {
      // 1/7 清理覆盖率文件
      this.cleanCoverage();

      // 启动后台服务
      await this.startBackgroundServices();

      // 等待服务启动
      await this.waitForServices();

      // 7/7 运行 Cypress
      this.runCypress();
    } catch (error) {
      console.error('Startup sequence failed:', error);
      await this.shutdown();
    }
  }

  /**
   * 清理覆盖率文件
   */
  cleanCoverage() {
    this.log('GREEN', 'Cleaning coverage artifacts...');
    const target = path.join(this.PROJECT_PATH, 'core', 'webapp');
    for (const item of fs.readdirSync(target)) {
      if (/^coverage/.test(item)) {
        fs.rmSync(path.join(target, item), { recursive: true, force: true });
      }
    }
  }

  /**
   * 提取第一个 HTTP URL
   * @param {string} output 命令输出
   * @returns {string|null} 第一个 HTTP URL 或 null
   */
  extractHttpsUrl(output) {
    if (!output) {
      return null;
    }

    const httpUrlRegex = /https?:\/\/[^\s]+\.abtnet\.io[^\s]*/g;
    const matches = output.match(httpUrlRegex);

    if (matches && matches.length > 0) {
      // 找到第一个 HTTPS URL
      const httpUrl = matches.find((url) => url.startsWith('https://'));
      if (httpUrl) {
        return httpUrl;
      }
      // 如果没有 HTTPS URL，返回第一个匹配的 URL
      return matches[0];
    }

    return null;
  }

  async startBackgroundServices() {
    this.log('GREEN', 'Starting background services...');

    try {
      // 清理并创建临时目录
      await $`rm -fr /tmp/abtnode/e2e ${path.join(this.webappDir, '.nyc_output')}`;
      await $`mkdir -p /tmp/abtnode/e2e`;
      this.log('GREEN', 'Cleaned up temporary directories');

      // 启动 static server
      this.log('GREEN', 'Starting static server...');
      $.spawn('npm', ['run', 'start-e2e:static'], {
        cwd: this.webappDir,
        env: process.env,
        detached: false,
        stdio: ['ignore', 'ignore', 'ignore'],
        shell: false,
      });
      this.log('GREEN', 'Static server started successfully');

      // 启动 blocklet server
      $.env = {
        ...process.env,
        ...this.envVars,
      };
      this.log('GREEN', 'Starting blocklet server...');
      const { stdout } = await $`cd /tmp/abtnode/e2e && ${this.cli} server start -a`;
      console.log('stdout', stdout);

      // 提取并输出第一个 HTTP URL
      this.abtNodeBaseUrl = this.extractHttpsUrl(stdout);
      if (!this.abtNodeBaseUrl) {
        throw new Error('Can not find HTTP URL');
      }

      this.log('GREEN', `Blocklet server started successfully: ${this.abtNodeBaseUrl}`);
    } catch (error) {
      this.log('RED', `Failed to start background services: ${error.message}`);
      throw error;
    }
  }

  /**
   * 等待服务启动
   */
  async waitForServices() {
    await this.waitPort('127.0.0.1', 3030, 60_000, 1000);
  }

  /**
   * 运行 Cypress
   */
  runCypress() {
    this.log('GREEN', '[7/7] Running Cypress...');
    const script = this.CI_MODE ? 'cypress-ci' : 'cypress-open';
    const cypressEnv = {
      ...process.env,
      E2E_ENABLE_DOCKER_MODE: this.DOCKER_MODE ? 'true' : 'false',
      ...this.envVars,
      ABT_NODE_BASE_URL: this.abtNodeBaseUrl,
    };

    // 使用 zx 运行 Cypress
    const cypress = $.spawn('npm', ['run', script], {
      cwd: this.webappDir,
      env: cypressEnv,
      stdio: 'inherit',
    });

    cypress.on('exit', (code) => {
      if (code) {
        this.log('RED', `Cypress failed with code ${code}`);
        this.shutdown(code);
      } else {
        this.log('GREEN', 'Cypress finished successfully');
        this.shutdown(0);
      }
    });

    cypress.on('error', (err) => {
      console.error(err);
      this.log('RED', `Error running Cypress: ${err.message}`);
      this.shutdown(1);
    });

    cypress.on('disconnect', () => {
      this.log('RED', 'Cypress disconnected');
      this.shutdown(1);
    });
  }

  async shutdown(code = 0) {
    this.log('RED', 'Killing background services...');
    await $`${this.cli} server stop -f`;
    this.log('GREEN', 'Background services killed!');
    try {
      await $`pkill nginx`;
    } catch (error) {
      // nginx kill 失败不影响退出
      this.log('RED', `Failed to kill nginx: ${error.message}`);
    }

    process.exit(code);
  }

  /**
   * 等待端口可用
   * @param {string} host 主机地址
   * @param {number} port 端口号
   * @param {number} timeout 超时时间（毫秒）
   * @param {number} interval 重试间隔（毫秒）
   * @returns {Promise<boolean>}
   */
  waitPort(host, port, timeout = 60_000, interval = 1000) {
    this.log('YELLOW', `Waiting for ${host}:${port} (timeout ${timeout / 1000}s)...`);
    const start = Date.now();

    return new Promise((resolve, reject) => {
      const tryConnect = () => {
        const socket = net.createConnection({ host, port });
        socket.once('connect', () => {
          socket.destroy();
          this.log('GREEN', `${host}:${port} is up`);
          resolve(true);
        });
        socket.once('error', () => {
          socket.destroy();
          if (Date.now() - start > timeout) {
            this.log('RED', `Timeout waiting for ${host}:${port}`);
            reject(new Error('timeout'));
          } else {
            setTimeout(tryConnect, interval);
          }
        });
      };
      tryConnect();
    });
  }
}

// 创建实例并启动
const e2eEnv = new E2EEnvironment();
e2eEnv.start().catch((error) => {
  console.error('Failed to start E2E environment:', error);
  process.exit(1);
});
