const { verifyRequest } = require('@blocklet/did-space-js');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const createTranslator = require('@abtnode/util/lib/translate');
const { createRateLimiter } = require('@blocklet/rate-limit');

const { emailSchema } = require('../../socket/channel/did');
const { sendEmail } = require('../../libs/email');
const { isEmailBlocked, isEmailAllowed } = require('../../libs/kyc');

const logger = require('../../libs/logger')('kyc');

const translations = {
  en: {
    emailInvalid: 'Email is invalid',
    emailAlreadyVerified:
      'This email has already been verified. You can recover the verification NFT from your DID Wallet.',
    emailNotAllowed:
      "Sorry, we can't accept email addresses from this domain. Please use an email address from a different provider.",
    emailBlocked: "We're unable to use this email address. Please try a different email address from another provider.",
    emailSendSuccess: 'Verify code successfully sent',
    emailAlreadySent:
      "We've already sent a verification email. Please check your inbox or spam folder. If you don't see it, you can try again in a few minutes.",
    emailVerifySuccess: 'Email is successfully verified',
    emailTitle: 'Verify Your Email for {appName}',
    emailHeadline:
      'To ensure the security of your account and enhance your experience, you need to use following code to verify your email, and you will receive a NFT in your DID Wallet upon verification.',

    userNotFound: 'User not found',
  },
  zh: {
    emailInvalid: '邮箱格式不正确',
    emailAlreadyVerified: '此邮箱已验证。您可以从 DID Wallet 中恢复验证证书。',
    emailNotAllowed: '对不起，我们不接受此域名的电子邮箱地址。请使用来自不同提供商的电子邮箱地址。',
    emailBlocked: '我们无法使用此电子邮箱地址。请尝试使用来自不同提供商的电子邮箱地址。',
    emailSendSuccess: '验证码发送成功',
    emailAlreadySent: '我们已发送验证电子邮件。请检查您的收件箱或垃圾邮件文件夹。如果您没有看到它，您可以稍后再试。',
    emailVerifySuccess: '邮箱验证成功',
    emailTitle: '验证您在 {appName} 的邮箱',
    emailHeadline:
      '为确保您的帐户安全并增强您的体验，您需要使用以下代码验证您的邮箱，并在验证后在您的 DID Wallet 中收到 NFT。',
    userNotFound: '用户不存在',
  },
};

const t = createTranslator({ translations });

function createEmailLimiter({ prefix, getEmail }) {
  const limit = process.env.ABT_NODE_EMAIL_RATE_LIMIT || 1;

  return [
    // IP limit
    createRateLimiter({ prefix, limit, skipFailedRequests: true }),
    // email limit
    createRateLimiter({
      prefix,
      limit,
      keyGenerator: (req) => getEmail(req),
      skipFailedRequests: true,
    }),
  ];
}

const init = ({ node }) => {
  const onStartEmailVerify = async (req, res) => {
    const { locale = 'en' } = req.query;
    try {
      const [blocklet, info] = await Promise.all([req.getBlocklet(), req.getBlockletInfo()]);
      const teamDid = blocklet.meta.did;

      const { error, value: subject } = emailSchema.validate(req.body.email);

      if (error) {
        return res.status(400).send({ error: t('emailInvalid', locale), code: 'email_invalid' });
      }

      // Do not issue duplicate email nft to same user
      if (req.user) {
        if (await node.isSubjectIssued({ teamDid, userDid: req.user.did, subject })) {
          return res.status(400).send({
            error: t('emailAlreadyVerified', locale),
            code: 'email_already_verified',
          });
        }
      }

      const isAllowed = await isEmailAllowed(blocklet, subject);
      if (!isAllowed) {
        logger.warn('Email domain is not allowed', { teamDid, subject });
        return res.status(400).send({
          error: t('emailNotAllowed', locale),
          code: 'email_not_allowed',
        });
      }

      const isBlocked = await isEmailBlocked(blocklet, subject);
      if (isBlocked) {
        logger.warn('Email domain is blocked', { teamDid, subject });
        return res.status(400).send({
          error: t('emailBlocked', locale),
          code: 'email_blocked',
        });
      }

      if (await node.isSubjectSent({ teamDid, subject })) {
        return res.status(400).send({
          error: t('emailAlreadySent', locale),
          code: 'email_already_sent',
        });
      }

      const doc = await node.createVerifyCode({ teamDid, subject, purpose: 'kyc' });
      logger.info('create verify code', { teamDid, doc });

      const result = await sendEmail(
        subject,
        {
          code: doc.code,
          title: t('emailTitle', locale, { appName: info.name }),
          body: t('emailHeadline', locale),
        },
        {
          teamDid,
          node,
          locale: req.query.locale,
          raw: true,
          launcher: true,
          template: 'kyc-code-verify',
        }
      );
      logger.info('send verify code', { teamDid, result });
      await node.sendVerifyCode({ teamDid, code: doc.code });

      return res.status(200).send({ message: t('emailSendSuccess', locale) });
    } catch (error) {
      logger.error('Send mail failed', { error });
      return res.status(400).send(error.message);
    }
  };

  const onEndEmailVerify = async (req, res) => {
    const { locale = 'en' } = req.query;
    try {
      const blocklet = await req.getBlocklet();
      const teamDid = blocklet.meta.did;

      const { code } = req.body;
      const result = await node.consumeVerifyCode({ teamDid, code });
      logger.info('consume verify code', { teamDid, code, result });

      return res.status(200).send({ message: t('emailVerifySuccess', locale) });
    } catch (error) {
      logger.error('Verify mail failed', { error });
      return res.status(400).send(error.message);
    }
  };

  const onCheckKycStatus = async (req, res) => {
    const { locale = 'en' } = req.query;
    try {
      // verify signature
      const userDid = verifyRequest({
        url: req.originalUrl,
        method: req.method,
        data: req.body,
        headers: req.headers,
      });

      // validate subject
      const { error, value: subject } = emailSchema.validate(req.body.subject);
      if (error) {
        return res.json({ verified: false, error: t('emailInvalid', locale) });
      }

      // check user
      const blocklet = await req.getBlocklet();
      const teamDid = blocklet.meta.did;
      const user = await node.getUser({ teamDid, user: { did: userDid }, options: { enableConnectedAccount: true } });
      if (!user) {
        return res.json({ verified: false, error: t('userNotFound', locale) });
      }

      // check kyc status
      const result = await node.isSubjectIssued({ teamDid, userDid, subject });
      logger.info('check kyc status', { teamDid, userDid, subject, result });
      return res.json({ verified: result });
    } catch (error) {
      logger.error('check kyc status failed', { error });
      return res.json({ verified: false, error: error.message });
    }
  };

  return {
    attach: (app) => {
      app.post(
        `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/kyc/email/send`,
        createEmailLimiter({ prefix: '/api/kyc/email/send', getEmail: (req) => req.body.email }),
        onStartEmailVerify
      );
      app.post(
        `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/kyc/email/verify`,
        createRateLimiter({
          limit: process.env.ABT_NODE_EMAIL_VERIFY_RATE_LIMIT || 5,
          prefix: '/api/kyc/email/verify',
        }),
        onEndEmailVerify
      );
      app.post(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/kyc/status`, onCheckKycStatus);
    },
  };
};

module.exports = { init, createEmailLimiter };
