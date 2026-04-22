import { Section, Text, Link } from '@react-email/components';
// @ts-ignore
import { ACTIVITY_DESCRIPTIONS } from '@abtnode/util/lib/notification-preview/util';
// @ts-ignore
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { joinURL, withHttps, withQuery } from 'ufo';
import { attachmentsStyle, severityColorMap } from '../_libs/style';

function getActivityContent(activity: any, receiverDid: string) {
  const { type, target } = activity || {};
  const { type: targetType, author } = target || {};

  const descriptionFn = ACTIVITY_DESCRIPTIONS[type];
  const targetName = targetType === 'doc' ? 'document' : targetType;
  // email 这里不涉及相同 type 合并的情况，所以 count 固定为 1
  const isAuthor = !author || (receiverDid && author === receiverDid);
  return descriptionFn ? descriptionFn(targetName, 1, isAuthor) : null;
}

function Activity({
  activity,
  actor,
  siteDomain = '',
  severity = 'normal',
  userInfo,
}: {
  activity: any;
  actor: any;
  siteDomain: string;
  severity?: 'normal' | 'success' | 'error' | 'warning';
  userInfo?: {
    did?: string;
    fullName?: string;
    email?: string;
  };
}) {
  const content = getActivityContent(activity, userInfo?.did || '');
  const { target, meta } = activity || {};
  const { fullName = 'System', did } = actor || {};

  // 避免 siteDomain 中带有协议
  const profileLink = withQuery(joinURL(withHttps(siteDomain), WELLKNOWN_SERVICE_PATH_PREFIX, 'user'), { did });

  return (
    <Section>
      {content ? (
        <Text className="content">
          {did ? (
            <Link href={profileLink} style={{ display: 'inline' }}>
              {fullName}
            </Link>
          ) : (
            fullName
          )}{' '}
          {content}{' '}
          <Link href={target.id} style={{ display: 'inline' }}>
            {target.name || target.desc}.
          </Link>
        </Text>
      ) : null}
      {/* Meta 信息 */}
      {meta && meta.content ? (
        <Section style={{ ...attachmentsStyle, borderColor: severityColorMap[severity] || severityColorMap.normal }}>
          <a
            href={meta.id}
            target="_blank"
            style={{
              textDecoration: 'none',
              color: 'initial',
              display: 'block',
            }}>
            <Text>{meta.content}</Text>
          </a>
        </Section>
      ) : null}
    </Section>
  );
}

export default Activity;
