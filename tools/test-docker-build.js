#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { $, chalk } = require('zx');
const path = require('path');
const os = require('os');
$.verbose = true;

// 配置
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOCKERFILE = 'blocklet-dev.Dockerfile';
const IMAGE_NAME = 'blocklet-server-dev:test';
const CLI_PACKAGE = process.env.BLOCKLET_SERVER_CLI_PACKAGE || '@blocklet/cli@beta';

// 颜色输出
const info = (msg) => console.log(chalk.blue(`ℹ ${msg}`));
const success = (msg) => console.log(chalk.green(`✓ ${msg}`));
const error = (msg) => console.log(chalk.red(`✗ ${msg}`));
const warn = (msg) => console.log(chalk.yellow(`⚠ ${msg}`));

class DockerBuildTest {
  constructor() {
    this.platform = this.detectPlatform();
    this.containerName = `blocklet-test-${Date.now()}`;
  }

  detectPlatform() {
    const arch = os.arch();
    const platform = os.platform();

    if (platform === 'darwin') {
      return arch === 'arm64' ? 'linux/arm64' : 'linux/amd64';
    }
    if (platform === 'linux') {
      return arch === 'arm64' ? 'linux/arm64' : 'linux/amd64';
    }
    return 'linux/amd64';
  }

  async checkDocker() {
    info('检查 Docker 是否可用...');
    try {
      await $`docker --version`;
      success('Docker 已安装');
      return true;
    } catch (e) {
      error('Docker 未安装或未启动');
      error('请先安装并启动 Docker: https://www.docker.com/get-started');
      return false;
    }
  }

  async buildImage() {
    info(`开始构建 Docker 镜像 (平台: ${this.platform})...`);
    info(`使用 CLI 包: ${CLI_PACKAGE}`);

    try {
      await $`docker build \
        --platform ${this.platform} \
        --build-arg BLOCKLET_SERVER_CLI_PACKAGE=${CLI_PACKAGE} \
        -f ${DOCKERFILE} \
        -t ${IMAGE_NAME} \
        ${PROJECT_ROOT}`;

      success('镜像构建成功');
      return true;
    } catch (e) {
      error('镜像构建失败');
      console.error(e);
      return false;
    }
  }

  async verifyImage() {
    info('验证镜像内容...');

    try {
      // 检查镜像是否存在
      await $`docker image inspect ${IMAGE_NAME}`;
      success('镜像存在');

      // 启动临时容器验证
      info('启动临时容器进行验证...');

      // 检查 blocklet cli 版本
      info('检查 blocklet CLI...');
      const blockletVersion =
        await $`docker run --rm --name ${this.containerName}-blocklet ${IMAGE_NAME} blocklet --version`;
      success(`blocklet CLI 版本: ${blockletVersion.stdout.trim()}`);

      // 检查 node 版本
      info('检查 Node.js...');
      const nodeVersion =
        await $`docker run --rm --name ${this.containerName}-node ${IMAGE_NAME} node --version`;
      success(`Node.js 版本: ${nodeVersion.stdout.trim()}`);

      // 检查 pnpm 版本
      info('检查 pnpm...');
      const pnpmVersion =
        await $`docker run --rm --name ${this.containerName}-pnpm ${IMAGE_NAME} pnpm --version`;
      success(`pnpm 版本: ${pnpmVersion.stdout.trim()}`);

      // 检查 pm2 版本
      info('检查 pm2...');
      const pm2Version =
        await $`docker run --rm --name ${this.containerName}-pm2 ${IMAGE_NAME} pm2 --version`;
      success(`pm2 版本: ${pm2Version.stdout.trim()}`);

      // 检查 nginx
      info('检查 nginx...');
      const nginxVersion =
        await $`docker run --rm --name ${this.containerName}-nginx ${IMAGE_NAME} nginx -v`;
      success(`nginx 版本: ${nginxVersion.stderr.trim()}`);

      success('所有验证通过');
      return true;
    } catch (e) {
      error('镜像验证失败');
      console.error(e);
      return false;
    }
  }

  async cleanup() {
    info('清理测试镜像...');
    try {
      await $`docker rmi ${IMAGE_NAME}`;
      success('测试镜像已删除');
    } catch (e) {
      warn('清理测试镜像失败 (可能已被删除)');
    }
  }

  async run() {
    console.log(chalk.bold('\n🐳 Blocklet Server Docker 构建测试\n'));

    // 1. 检查 Docker
    if (!(await this.checkDocker())) {
      process.exit(1);
    }

    // 2. 构建镜像
    if (!(await this.buildImage())) {
      process.exit(1);
    }

    // 3. 验证镜像
    if (!(await this.verifyImage())) {
      await this.cleanup();
      process.exit(1);
    }

    // 4. 询问是否清理
    console.log('');
    info('测试完成！');
    warn(`镜像 ${IMAGE_NAME} 已构建成功`);
    warn('如需手动测试，可运行:');
    console.log(chalk.cyan(`  docker run --rm -it -p 80:80 -p 443:443 ${IMAGE_NAME}`));
    console.log('');

    const shouldCleanup = process.env.CI || process.argv.includes('--cleanup');
    if (shouldCleanup) {
      await this.cleanup();
    } else {
      warn('使用 --cleanup 标志自动删除测试镜像');
    }

    success('\n✨ 所有测试通过！\n');
  }
}

// 运行测试
const test = new DockerBuildTest();
test.run().catch((e) => {
  error('测试失败');
  console.error(e);
  process.exit(1);
});
