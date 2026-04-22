const { Joi } = require('@arcblock/validator');
const { render } = require('@react-email/components');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getEmailServiceProvider, getEmailSignatureConfig } = require('@abtnode/auth/lib/email');
const { sendEmailWithLauncher } = require('@abtnode/auth/lib/launcher');
const { isActivityIncluded } = require('@abtnode/util/lib/notification-preview/util');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { joinURL } = require('ufo');
const { getBlockletThemeOptions, mergeThemeOptions, BLOCKLET_THEME_LIGHT } = require('@blocklet/theme');

const logger = require('./logger')('blocklet-services:notification');
const { NotificationEmail } = require('../emails/_templates/notification');
const { ActivityNotificationEmail } = require('../emails/_templates/activity-notification');
const { VerifyCodeEmail } = require('../emails/_templates/verify-code');
const { KycCodeVerifyEmail } = require('../emails/_templates/kyc-code-verify');
const { NewUserSessionEmail } = require('../emails/_templates/new-user-session');
const cache = require('../cache');
const { attachNotificationUTM, getUTMUrl } = require('../util/utm');

const schemaEmail = Joi.string().email().required();

const validateEmail = schemaEmail.validateAsync.bind(schemaEmail);

async function sendEmail(
  receiver,
  notification,
  {
    teamDid,
    node,
    locale,
    unsubscribeToken = '',
    userInfo = {},
    raw = false,
    launcher = false,
    template = 'notification',
    extraData,
  }
) {
  if (!receiver) {
    throw new Error('receiver is required');
  }

  if (!notification.title && !notification.body) {
    throw new Error('notification is required');
  }

  const blocklet = await node.getBlocklet({ did: teamDid, useCache: true });
  if (!blocklet) {
    throw new Error(`Failed to get blocklet: ${teamDid}`);
  }

  const provider = getEmailServiceProvider(blocklet);
  logger.debug('service.sendEmail', { teamDid, provider, raw, launcher });
  if (!provider || (provider === 'launcher' && !launcher)) {
    const error = new Error('Email Service is not available.');
    error.logLevel = 'debug';
    throw error;
  }

  // eslint-disable-next-line no-param-reassign
  notification = attachNotificationUTM(notification);

  if (provider === 'service') {
    const config = blocklet.settings?.notification?.email;
    const info = getBlockletInfo(blocklet);
    const logo = joinURL(info.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo-rect?imageFilter=convert&f=png');

    const themeMode = 'light';
    const options = mergeThemeOptions(
      BLOCKLET_THEME_LIGHT,
      getBlockletThemeOptions(themeMode, blocklet.settings?.theme)
    );
    const theme = options;

    const appInfo = notification.appInfo || {
      logo,
      description: info.description,
      title: info.name,
      version: info.version,
      url: getUTMUrl(info.appUrl, notification.utm, notification?.sender?.componentDid),
    };

    const emailSignature = getEmailSignatureConfig(blocklet);

    const subject = `${
      notification.title ||
      { zh: '您收到了一个通知', en: 'You have received a notification' }[locale] ||
      'You have received a notification'
    }`;

    let html = '';
    try {
      if (template === 'notification') {
        // 会有两种情况，1. 通知包含 activity 2. 通知不包含 activity
        // 1. 如果包含 activity 则需要新的模板渲染
        // 2. 如果不包含 activity 则继续按照之前的内容进行处理
        if (isActivityIncluded(notification)) {
          // 获取站点的 domain
          const siteDomain = info.appUrl;
          let { actorInfo } = notification;
          // 需要先获取到 actor 数据
          if (!actorInfo && notification.activity.actor) {
            actorInfo = await node.getUserByDid({
              teamDid,
              userDid: notification.activity.actor,
              attributes: ['did', 'fullName', 'avatar'],
            });
          }
          html = await render(
            ActivityNotificationEmail({
              subject,
              appInfo,
              ...notification,
              actor: actorInfo,
              siteDomain,
              locale,
              raw,
              unsubscribeToken,
              userInfo: {
                ...userInfo,
                email: receiver,
              },
              signatureConfig: emailSignature,
              theme,
            })
          );
        } else if (typeof raw === 'string') {
          html = raw;
        } else {
          html = await render(
            NotificationEmail({
              subject,
              appInfo,
              ...notification,
              locale,
              raw,
              unsubscribeToken,
              userInfo: {
                ...userInfo,
                email: receiver,
              },
              signatureConfig: emailSignature,
              theme,
            })
          );
        }
      } else if (template === 'verify-code') {
        html = await render(
          VerifyCodeEmail({
            subject,
            appInfo,
            ...notification,
            locale,
            raw,
            userInfo: {
              ...userInfo,
              email: receiver,
            },
            signatureConfig: emailSignature,
            theme,
          })
        );
      } else if (template === 'kyc-code-verify') {
        html = await render(
          KycCodeVerifyEmail({
            subject,
            appInfo,
            ...notification,
            locale,
            raw,
            unsubscribeToken,
            userInfo: {
              ...userInfo,
              email: receiver,
            },
            signatureConfig: emailSignature,
            theme,
          })
        );
      } else if (template === 'new-user-session') {
        html = await render(
          NewUserSessionEmail({
            subject,
            appInfo,
            ...notification,
            locale,
            userInfo: {
              ...userInfo,
              email: receiver,
            },
            userSession: extraData?.userSession,
            theme,
          })
        );
      }
    } catch (err) {
      logger.error('Failed to render email template:', err);
      throw new Error(`Failed to render ${template} template: ${err.message}`);
    }

    const emailData = {
      from: `"${appInfo.title}" <${config.from}>`,
      to: receiver,
      title: notification.title,
      subject,
      html,
      replyTo: config.from,
    };

    if (process.env.NODE_ENV === 'test') {
      return {
        messageId: 'test-message-id',
        accepted: [emailData.to],
        rejected: [],
        response: 'Test environment - Email skipped',
      };
    }
    const transporter = await cache.getTransport({ did: teamDid, config });
    const result = await transporter.sendMail(emailData);
    return result;
  }

  if (provider === 'launcher') {
    if (!blocklet.controller) {
      throw new Error('Launcher info not available.');
    }

    const info = await node.getNodeInfo({ useCache: true });
    const result = await sendEmailWithLauncher(info.sk, blocklet.controller, {
      receiver,
      notification,
      options: { locale, raw },
    });
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  }

  throw new Error('Unknown email provider.');
}

module.exports = {
  validateEmail,
  sendEmail,
};
