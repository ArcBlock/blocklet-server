const { filesize } = require('filesize');
const { sendToAppChannel } = require('@blocklet/sdk/lib/util/send-notification');
const { getAppPublicChannel } = require('@blocklet/meta/lib/channel');

const logger = require('@abtnode/logger')('@abtnode/core:monitor');

class NodeMonitSender {
  constructor({ node, interval }) {
    this.node = node;
    this.nodeInfo = null;
    this.interval = interval || 1000 * 60;
    this.lastTime = 0;
  }

  async getNodeInfo() {
    if (!this.nodeInfo) {
      this.nodeInfo = await this.node.getNodeInfo();
    }

    return this.nodeInfo;
  }

  async getSender() {
    const nodeInfo = await this.getNodeInfo();
    return {
      appDid: nodeInfo.did,
      appSk: nodeInfo.sk,
    };
  }

  /**
   * @param {{
   *  cpu?: {
   *    currentLoad?: number
   *  };
   *  mem?: {
   *    total?: number;
   *    available?: number;
   *  };
   * }} data
   */
  async sendToWallet(data) {
    if (Date.now() - this.lastTime < this.interval) {
      return;
    }

    if (!data || !data.cpu || !data.mem) {
      return;
    }

    try {
      const cpuPercent = data.cpu.currentLoad || 0;
      const totalMem = data.mem.total || 0;
      const freeMem = data.mem.available || 0;
      const usedMem = totalMem - freeMem;
      const cpuWanning = cpuPercent > 90;
      const cpuContent = `${Math.floor(cpuPercent)}%`;
      const memoryPercent = (usedMem / totalMem) * 100;
      const memoryWanning = memoryPercent > 90;
      const memContent = `${filesize(Math.floor(usedMem), { base: 2 })} (${Math.floor(memoryPercent)}%)`;

      const sender = await this.getSender();
      const channel = getAppPublicChannel(sender.appDid);

      const notification = {
        type: 'feed',
        feedType: 'data-tracker',
        data: {
          cardTitle: 'Server Usage',
          items: [
            {
              title: 'CPU',
              content: cpuContent,
              content_color: cpuWanning ? '#FF1111' : '#222222',
            },
            {
              title: 'MEM',
              content: memContent,
              content_color: memoryWanning ? '#FF1111' : '#222222',
            },
          ],
        },
      };

      await sendToAppChannel(channel, 'message', notification, sender, process.env.ABT_NODE_SERVICE_PORT);

      this.lastTime = Date.now();
    } catch (error) {
      delete error.request;
      delete error.response;
      delete error.config;
      logger.error('failed to push notification to wallet', { error });
    }
  }
}

module.exports = {
  NodeMonitSender,
};
