/* eslint-disable no-console */
const dotenvFlow = require('dotenv-flow');
const path = require('path');
const fs = require('fs-extra');
const Mcrypto = require('@ocap/mcrypto');
const { fromRandom, fromJSON, WalletType } = require('@ocap/wallet');

dotenvFlow.config();

class E2EPreparer {
  constructor() {
    this.baseDir = process.cwd();
    this.cypressDir = path.join(this.baseDir, '.cypress');
    this.e2eFile = path.join(this.baseDir, '.env.e2e');
    this.devFile = path.join(this.baseDir, '.env.development.local');
  }

  /**
   * 确保钱包存在，如果不存在则创建新的
   * @param {string} name 钱包名称
   */
  ensureWallet(name) {
    if (!name) {
      throw new Error('name cannot be empty');
    }

    const walletFile = path.join(this.cypressDir, `${name}.json`);
    fs.mkdirpSync(path.dirname(walletFile), { recursive: true });

    if (fs.existsSync(walletFile)) {
      const json = JSON.parse(fs.readFileSync(walletFile).toString());
      const wallet = fromJSON(json);
      console.log('Reuse existing wallet', json, wallet);
      return wallet;
    }

    const type = this.createWalletType();
    const wallet = fromRandom(type);
    fs.writeFileSync(walletFile, JSON.stringify(wallet.toJSON()));
    console.log(`Generate new ${name} wallet`, JSON.stringify(wallet.toJSON()));
    return wallet;
  }

  /**
   * 创建钱包类型配置
   * @returns {Object} 钱包类型配置
   */
  createWalletType(options = {}) {
    return WalletType({
      role: Mcrypto.types.RoleType.ROLE_ACCOUNT,
      pk: Mcrypto.types.KeyType.ED25519,
      hash: Mcrypto.types.HashType.SHA3,
      ...options,
    });
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
   * 生成环境配置文件内容
   * @param {Object} wallet 钱包对象
   * @returns {string} 环境配置内容
   */
  generateEnvContent(wallet) {
    return `# server only
ABT_NODE_DATA_DIR="/tmp/abtnode/e2e"
ABT_NODE_SESSION_SECRET="${wallet.publicKey}"
ABT_NODE_SK="${wallet.secretKey}"
ABT_NODE_DID="${wallet.address}"
ABT_NODE_PORT=3030
ABT_NODE_HTTP_PORT=8080
ABT_NODE_HTTPS_PORT=8443
ABT_NODE_ROUTER_PROVIDER=default

# both server and client
ABT_NODE_NAME="ABT Node (Cypress)"
ABT_NODE_DESCRIPTION="Just for E2E Test Purpose"
ABT_NODE_DID="${wallet.address}"
ABT_NODE_BASE_URL="http://127.0.0.1:3030"

# other config
DID_CONNECT_MFA_DISABLED=1
VITE_NO_MFA_PROTECTED_METHODS=1
`;
  }

  /**
   * 执行完整的 E2E 准备工作
   */
  prepare() {
    this.ensureWallet('owner');
    this.ensureWallet('admin');
  }
}

// 创建实例并执行准备工作
console.log('E2E preparer start');
const preparer = new E2EPreparer();
preparer.prepare();
console.log('E2E preparer end');
