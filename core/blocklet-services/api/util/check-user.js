const createTranslator = require('@abtnode/util/lib/translate');
const { CustomError } = require('@blocklet/error');

const translations = {
  zh: {
    notAllowed: '你已经被禁止访问该应用',
    needComponentId: '缺少登录参数: componentId',
    userInfoError: '登录用户信息有误',
    notExist: '用户不存在',
    //
    emailInvalid: '邮箱格式不正确',
    emailSendSuccess: '验证码发送成功',
    emailAlreadySent: '我们已发送验证电子邮件。请检查您的收件箱或垃圾邮件文件夹。如果您没有看到它，您可以稍后再试。',
    emailVerifySuccess: '邮箱验证成功',
    emailTitle: '登录 {appName}',
    invalidVerifyCode: '验证码不正确',
    missingInviteId: '缺少邀请 ID',
    notAllowedToDestroy: '用户不能通过此方法删除',
    failedToDestroyUser: '删除用户失败',
    userSettingsArePrivate: '用户设置为私密，访问被拒绝',
    ownerAddressIsRequired: '请求参数 ownerAddress 不能为空',
    notAuthorized: '请登录后访问',
  },
  en: {
    notAllowed: 'Your have been revoked access to this blocklet',
    needComponentId: 'componentId is required when login user',
    userInfoError: 'Login user info is invalid',
    notExist: 'User does not exist',

    emailInvalid: 'Invalid email format',
    emailSendSuccess: 'Verification code sent successfully',
    emailAlreadySent:
      "We've sent a verification email. Please check your inbox and spam folder. If you don't see it, you can try again in a few minutes.",
    emailVerifySuccess: 'Email verified successfully',
    emailTitle: 'Login to {appName}',
    invalidVerifyCode: 'Invalid verify code',
    missingInviteId: 'Missing invite ID',
    notAllowedToDestroy: 'User can not destroy by this method',
    failedToDestroyUser: 'Failed to destroy user',
    userSettingsArePrivate: 'User settings are private, access denied',
    ownerAddressIsRequired: 'Request parameter ownerAddress cannot be empty',
    notAuthorized: 'Please login to access',
  },
};

const t = createTranslator({ translations });

function ensureUserExists(user, { locale } = {}) {
  if (!user) {
    throw new CustomError(404, t('notExist', locale));
  }
}

function ensureUserEnabled(user, { locale } = {}) {
  if (!user.approved) {
    throw new CustomError(403, t('notAllowed', locale));
  }
}

module.exports = {
  ensureUserExists,
  ensureUserEnabled,
  t,
};
