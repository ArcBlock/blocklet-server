const Joi = require('joi');
const { IncomingWebhook } = require('@slack/webhook');
const logger = require('@abtnode/logger')('@abtnode/core:sender:slack');
const { toSlackLink } = require('@abtnode/util/lib/notification-preview/highlight');
const BaseSender = require('../base');

class SlackSender extends BaseSender {
  async send(params, message, type = 'attachments') {
    const url = params.find((x) => x.name === 'url').value;
    const { nodeInfo, status, title, description, urlInfo } = message;
    const colorMap = {
      error: '#f44336',
      success: '#43a047',
      info: '#4E6AF6',
      warning: '#ffa000',
    };

    const emojiMap = {
      error: ':x:',
      success: ':white_check_mark:',
      info: ':white_check_mark:',
      warning: ':heavy_exclamation_mark:',
    };

    const messageTypes = {
      attachments: {
        text: `${emojiMap[status]} ${description}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${nodeInfo?.name}*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${title} \n ${description}`,
            },
          },
        ],
        attachments: [
          {
            color: colorMap[status] || '#43a047',
            blocks: urlInfo,
          },
        ],
      },
      text: {
        text: description,
      },
    };
    try {
      const webhook = new IncomingWebhook(url);

      await webhook.send({
        ...messageTypes[type],
        username: 'Blocklet Server',
        icon_url: 'https://releases.arcblockio.cn/arcblock.png',
      });
    } catch (err) {
      console.error(err);
      logger.error('failed to push notification to slack', { api: url, message: JSON.stringify(message), error: err });
    }
  }

  sendTestMessage(params, message) {
    return this.send(
      params,
      {
        description: message,
      },
      'text'
    );
  }

  async sendNotification(url, message) {
    const { title, body, sender, attachments, actions = [] } = message;
    try {
      const blocks = [];
      if (title) {
        blocks.push({
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
          },
        });
      }
      if (body) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: toSlackLink(body),
          },
        });
      }

      // FIXME: support more attachment types: nft, image, token, vc
      (attachments || [])
        .filter((x) => x.type === 'section')
        .forEach((x) => {
          blocks.push({
            type: x.type,
            fields: x.fields.map((f) => ({ type: 'plain_text', text: f.data.text })),
          });
        });
      // support link section
      (attachments || [])
        .filter((x) => x.type === 'link')
        .forEach((x) => {
          blocks.push({
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_quote',
                elements: [
                  {
                    type: 'link',
                    url: x.data.url,
                    text: x.data.title,
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: `\n${x.data.url}`,
                  },
                ],
              },
            ],
          });
        });

      if (actions.length) {
        blocks.push({
          type: 'actions',
          elements: actions.map((x) => ({
            type: 'button',
            text: {
              type: 'plain_text',
              text: x.name,
            },
            style: 'primary',
            value: x.name,
            url: x.link,
          })),
        });
      }

      if (process.env.NODE_ENV === 'test') {
        return {
          text: 'ok',
        };
      }
      const webhook = new IncomingWebhook(url, {
        timeout: 60 * 1000, // 1 minutes
      });
      const res = await webhook.send({
        blocks,
        username: sender.name,
        icon_url: sender.logo,
      });
      return res;
    } catch (err) {
      logger.error('failed to push notification to slack', { api: url, error: err });
      throw err;
    }
  }
}

SlackSender.type = 'slack';

SlackSender.describe = () => ({
  type: SlackSender.type,
  title: 'Slack Integration',
  description: 'Send notification to a Slack Channel',
  params: [
    {
      name: 'url',
      description: 'Slack Incoming Webhook URL',
      required: true,
      defaultValue: '',
      value: '',
      type: 'slack',
      enabled: true,
      consecutiveFailures: 0,
      schema: Joi.string()
        .required()
        .custom((v, helper) => {
          const prefix = 'https://hooks.slack.com';
          if (v.startsWith(prefix)) {
            return v;
          }

          return helper.message(`Slack Webhook URL must start with ${prefix}`);
        }),
    },
  ],
});

module.exports = SlackSender;
