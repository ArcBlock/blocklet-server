import { Heading, Hr, Text, Link } from '@react-email/components';
// @ts-ignore
import { VERIFY_CODE_TTL } from '@abtnode/constant';
import Actions from '../_components/actions';
import type { Locale } from '../types';

// HACK: 只是短暂为了兼容现有 launcher 转发逻辑
export function VerifyCodeBody({
  appName,
  locale = 'en',
  code,
  magicLink,
  children,
}: {
  appName: string;
  locale?: Locale;
  code?: string;
  magicLink?: string;
  children?: React.ReactNode;
}) {
  const translations = {
    en: {
      title: `Sign in to ${appName}`,
      followConfirmation: `Please use the confirmation button below to complete your login.`,
      confirmButton: 'Confirm Sign in',
      useConfirmLink: 'If Confirm Button does not work, please use the link below.',
      orEnterCode: `Or enter the following code in the application: `,
      followEnterCode: `Please use the verification code below to complete your login.`,
      codeExpiresIn: `This code expires in ${VERIFY_CODE_TTL / 60 / 1000} minutes.`,
      doNotShareCodeTitle: 'Security Check:',
      doNotShareCode: 'Do not share this code with anyone.',
      doNotShareCode2: 'MyVibe employees will never ask for this code.',
    },
    zh: {
      title: `登录 ${appName}`,
      followConfirmation: `请使用下面的确认按钮完成登录。`,
      confirmButton: '确认登录',
      useConfirmLink: '如果确认按钮无法工作，请使用以下链接。',
      orEnterCode: `或者在应用中输入以下代码：`,
      followEnterCode: `请使用下面的验证码完成登录。`,
      codeExpiresIn: `此代码将在${VERIFY_CODE_TTL / 60 / 1000}分钟内过期。`,
      doNotShareCodeTitle: '安全提示：',
      doNotShareCode: '请勿将此代码分享给任何人。',
      doNotShareCode2: 'MyVibe 员工绝不会向您索要此代码。',
    },
  };

  const translation = translations[locale] || translations.en;

  const _code = code ? code.toString().trim() : '';

  const code1 = _code.slice(0, 3);
  const code2 = _code.slice(3);

  if (children) {
    return children;
  }

  if (code && magicLink) {
    return (
      <>
        <Text>{translation.followConfirmation}</Text>
        <Actions actions={[{ title: translation.confirmButton, link: magicLink }]} />

        <Hr />
        <Text>
          {translation.orEnterCode}
          <strong>{code}</strong>
        </Text>

        <Text>{translation.codeExpiresIn}</Text>
        <Text>
          <strong>{translation.doNotShareCodeTitle}</strong> {translation.doNotShareCode}
          <br />
          {translation.doNotShareCode2}
        </Text>
      </>
    );
  }
  if (magicLink) {
    return (
      <>
        <Text>{translation.followConfirmation}</Text>
        <Actions actions={[{ title: translation.confirmButton, link: magicLink }]} />
        <Text>{translation.useConfirmLink}</Text>
        <Link href={magicLink}>{magicLink}</Link>
      </>
    );
  }

  if (code) {
    return (
      <>
        <Text>{translation.followEnterCode}</Text>

        <Heading
          style={{
            textAlign: 'center',
            fontSize: '3em',
            letterSpacing: '2px',
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          }}>
          <span style={{ marginRight: '0.4em' }}>{code1}</span>
          <span>{code2}</span>
        </Heading>

        <Text style={{ textAlign: 'center', marginTop: '-1em' }}>{translation.codeExpiresIn}</Text>
        <Text>
          <strong>{translation.doNotShareCodeTitle}</strong> {translation.doNotShareCode}
          <br />
          {translation.doNotShareCode2}
        </Text>
      </>
    );
  }
}

export default VerifyCodeBody;
