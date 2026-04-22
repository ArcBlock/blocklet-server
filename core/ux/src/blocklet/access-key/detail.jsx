/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-access-key */
/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Dialog from '@arcblock/ux/lib/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import { useMemo } from 'react';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getDisplayName } from '@blocklet/meta/lib/util';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { toBase58 } from '@ocap/util';
import { joinURL } from 'ufo';
import BlockletBundleAvatar from '../bundle-avatar';
import DidAddress from '../../did-address';
import { renderRole } from '../../team/passports/new/passport-item';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';

import { ExpiredAt, useRoles } from './component';
import ClickToCopy from '../../click-to-copy';

import useMobile from '../../hooks/use-mobile';

export default function AccessKeyDetail({ accessKey, onCancel }) {
  const { t } = useLocaleContext();

  return (
    <Dialog
      title={t('accessKey')}
      onClose={onCancel}
      open
      PaperProps={{
        sx: {
          maxWidth: 800,
          '@media (max-width: 768px)': {
            margin: '16px',
            maxWidth: 'calc(100vw - 32px)',
          },
        },
      }}
      fullWidth>
      <Div>
        <BaseInfo accessKey={accessKey} />
      </Div>
    </Dialog>
  );
}

AccessKeyDetail.propTypes = {
  accessKey: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const Div = styled(Box)`
  margin-top: -16px;

  .tabs {
    margin-left: 0;
    margin-right: 0;
  }
`;

function BaseInfo({ accessKey }) {
  const { t, locale } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const node = useNodeContext();

  const roles = useRoles();
  const isMobile = useMobile();

  const currentComponent = (blocklet?.children || []).find((child) => child?.meta?.did === accessKey.componentDid);

  const p = roles.find((x) => x.name === accessKey.passport);
  const passportName = p ? p.title : accessKey.passport;

  const code = useMemo(() => {
    if (node.inService) {
      return `curl -H "Authorization: Bearer blocklet-${toBase58(accessKey.accessKeyPublic)}" "${joinURL(window.blocklet?.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/api/did/session')}"`;
    }

    return `curl -H "Authorization: Bearer blocklet-${toBase58(accessKey.accessKeyPublic)}" "${joinURL(window.location.origin, process.env.NODE_ENV === 'production' ? node?.info?.routing?.adminPath : '', '/api/did/session')}"`;
  }, [accessKey.accessKeyPublic, node.inService, node?.info?.routing?.adminPath]);

  const infoGroups = [
    {
      title: t('common.baseInfo'),
      items: [
        {
          label: t('setting.accessKey.accessKeyId'),
          content: <DidAddress did={accessKey.accessKeyId} showQrcode />,
        },
        ...(accessKey.authType === 'simple'
          ? [
              {
                label: t('setting.accessKey.accessKeySecret'),
                content: <ClickToCopy>{`blocklet-${toBase58(accessKey.accessKeyPublic)}`}</ClickToCopy>,
              },
            ]
          : []),
        {
          label: t('common.role'),
          content: <Box>{renderRole(passportName, accessKey.passport)}</Box>,
        },
        {
          label: t('common.createdVia'),
          content: accessKey.createdVia,
        },
        {
          label: t('common.createdBy'),
          content: accessKey.createdBy ? (
            <UserCard
              showDid
              did={accessKey.createdBy}
              cardType={CardType.Detailed}
              infoType={InfoType.Minimal}
              sx={{ border: 0, padding: 0 }}
            />
          ) : (
            '-'
          ),
        },
      ],
    },
    {
      title: t('common.timeInfo'),
      items: [
        {
          label: t('common.createdAt'),
          content: accessKey.createdAt ? (
            <RelativeTime value={accessKey.createdAt} type={isMobile ? 'absolute' : 'all'} locale={locale} />
          ) : (
            '-'
          ),
        },
        {
          label: t('common.lastUsedAt'),
          content: accessKey.lastUsedAt ? (
            <RelativeTime value={accessKey.lastUsedAt} type={isMobile ? 'absolute' : 'all'} locale={locale} />
          ) : (
            '-'
          ),
        },
        {
          label: t('common.expiredAt'),
          content: accessKey.expireAt ? <ExpiredAt value={accessKey.expireAt} /> : t('common.neverExpired'),
        },
      ],
    },
    {
      title: t('common.otherInfo'),
      items: [
        {
          label: t('setting.accessKey.authType'),
          content: accessKey.authType,
        },
        {
          label: t('common.remark'),
          content: accessKey.remark,
        },
        ...(accessKey.authType !== 'signature'
          ? [
              {
                label: t('setting.accessKey.resourceType'),
                content: accessKey.resourceType || '-',
              },
              {
                label: t('setting.accessKey.resourceId'),
                content: accessKey.resourceId || '-',
              },
            ]
          : []),
        ...(currentComponent
          ? [
              {
                label: t('setting.accessKey.component'),
                content: (
                  <Box
                    key={currentComponent}
                    sx={{
                      width: { xs: 250, sm: 400 },
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                    <BlockletBundleAvatar blocklet={currentComponent} ancestors={[blocklet]} />
                    <Box
                      sx={{
                        ml: '16px',
                        minWidth: 0,
                      }}>
                      <Box className="component-header">
                        <Box className="component-name">{getDisplayName(currentComponent, true)}</Box>
                        <Box className="component-version">{currentComponent?.meta?.version}</Box>
                      </Box>
                    </Box>
                  </Box>
                ),
              },
            ]
          : []),
        accessKey.authType !== 'signature'
          ? {
              label: t('setting.accessKey.usage'),
              content: <CodeBlock code={code} language="shell" showDefaultText={false} />,
            }
          : null,
      ].filter(Boolean),
    },
  ];

  return (
    <StyledDiv gap={3}>
      <Box className="info-area">
        {infoGroups.map((group) => (
          <Box
            key={group.title}
            sx={{
              mb: 3,
            }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {group.title}
            </Typography>
            <Box className="info-grid">
              {group.items.map((item) => (
                <Box key={item.label} className="info-item">
                  <Box className="info-label">
                    <Typography variant="subtitle2" color="textSecondary">
                      {item.label}
                    </Typography>
                  </Box>
                  <Box
                    className="info-content"
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      '@media (max-width: 768px)': {
                        width: '100%',
                        flex: 'none',
                      },
                    }}>
                    {item.content}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </StyledDiv>
  );
}

BaseInfo.propTypes = {
  accessKey: PropTypes.object.isRequired,
};

const StyledDiv = styled(Stack)`
  .info-card {
    margin-bottom: 24px;
    overflow: hidden;
  }

  .card-content {
    display: flex;
    gap: 32px;
    padding: 24px;
  }

  .passport-image {
    width: 150px;
    flex-shrink: 0;
    transition: transform 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
      transform: scale(1.05);
    }
  }

  .info-area {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .info-header {
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 8px;
    }
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 140px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      margin-bottom: 4px;
    }

    @media (max-width: 480px) {
      width: auto;
      min-width: auto;
    }
  }

  .info-content {
    word-break: break-word;
    overflow-wrap: break-word;

    /* 确保代码块和长文本在移动端正确显示 */
    pre,
    code {
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* 优化链接在移动端的显示 */
    a {
      word-break: break-all;
    }

    @media (max-width: 768px) {
      font-size: 14px;
      line-height: 1.5;
    }
  }

  .logs-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 24px;
      border-bottom: 1px solid #eee;
    }

    .MuiTimeline-root {
      padding: 24px;
    }

    .MuiTimelineContent-root {
      padding: 0px 16px;
    }

    .MuiTimelineDot-root {
      margin: 0;
    }
  }
`;
