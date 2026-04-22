import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { fromAppDid } from '@arcblock/did-ext';
import Avatar from '@arcblock/ux/lib/Avatar';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { useTeamContext } from '../../contexts/team';
import { ScopeChips, useClientLogo } from './component';
import ClickToCopy from '../../click-to-copy';
import { renderUser } from '../../team/passports/new/passport-item';

function InfoGroup({ title, items }) {
  return (
    <Box
      sx={{
        mb: 3,
      }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Stack spacing={1.5}>
        {items.map(({ label, value }) => (
          <Box
            key={label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ minWidth: 200 }}>
              {label}
            </Typography>
            <Typography sx={{ wordBreak: 'break-all' }}>{value || '-'}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

InfoGroup.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any,
    })
  ).isRequired,
};

export default function OauthClientDetail({ client, onClose }) {
  const { t, locale } = useLocaleContext();
  const { teamDid } = useTeamContext();
  const {
    clientName,
    clientId,
    clientSecret,
    redirectUris,
    scope,
    clientUri,
    logoUri,
    contacts,
    tosUri,
    policyUri,
    jwksUri,
    jwks,
    softwareId,
    softwareVersion,
    clientIdIssuedAt,
    clientSecretExpiresAt,
    updatedAt,
    createUser,
  } = client;
  const { clientLogoUrl } = useClientLogo(logoUri);

  const getEndpoint = (pathname) => {
    try {
      const url = new URL(window.blocklet.appUrl);
      url.pathname = pathname;
      return url.toString();
    } catch (error) {
      return '-';
    }
  };
  const wallet = fromAppDid(clientId, teamDid);

  const groups = [
    {
      title: t('common.baseInfo'),
      items: [
        { label: t('oauth.client.name'), value: clientName },
        {
          label: t('oauth.client.logoUri'),
          value: <Avatar variant="rounded" shape="square" src={clientLogoUrl} did={wallet.address} size={64} />,
        },
        { label: t('oauth.client.clientUri'), value: clientUri ? <ClickToCopy>{clientUri}</ClickToCopy> : '-' },
        { label: t('oauth.client.clientId'), value: <ClickToCopy>{clientId}</ClickToCopy> },
        { label: t('oauth.client.clientSecret'), value: <ClickToCopy>{clientSecret}</ClickToCopy> },
        {
          label: t('oauth.client.redirectUris'),
          value: <ClickToCopy>{(redirectUris || []).join(', ')}</ClickToCopy>,
        },
        { label: t('oauth.client.scope'), value: <ScopeChips scope={scope} /> },
        {
          label: t('oauth.client.createUser'),
          value: createUser ? renderUser(createUser, true) : t('oauth.client.openRegistration'),
        },
      ],
    },
    {
      title: t('oauth.client.oauthEndpoints'),
      items: [
        {
          label: t('oauth.client.openidConfiguration'),
          value: <ClickToCopy>{getEndpoint('/.well-known/openid-configuration')}</ClickToCopy>,
        },
        {
          label: t('oauth.client.authorizationEndpoint'),
          value: <ClickToCopy>{getEndpoint(`${WELLKNOWN_SERVICE_PATH_PREFIX}/oauth/authorize`)}</ClickToCopy>,
        },
        {
          label: t('oauth.client.tokenEndpoint'),
          value: <ClickToCopy>{getEndpoint(`${WELLKNOWN_SERVICE_PATH_PREFIX}/oauth/token`)}</ClickToCopy>,
        },
        {
          label: t('oauth.client.userinfoEndpoint'),
          value: <ClickToCopy>{getEndpoint(`${WELLKNOWN_SERVICE_PATH_PREFIX}/oauth/userinfo`)}</ClickToCopy>,
        },
        {
          label: t('oauth.client.jwksUri'),
          value: <ClickToCopy>{getEndpoint(`${WELLKNOWN_SERVICE_PATH_PREFIX}/oauth/jwks`)}</ClickToCopy>,
        },
        {
          label: t('oauth.client.registrationEndpoint'),
          value: <ClickToCopy>{getEndpoint(`${WELLKNOWN_SERVICE_PATH_PREFIX}/oauth/register`)}</ClickToCopy>,
        },
        {
          label: t('oauth.client.endSessionEndpoint'),
          value: <ClickToCopy>{getEndpoint(`${WELLKNOWN_SERVICE_PATH_PREFIX}/oauth/logout`)}</ClickToCopy>,
        },
      ],
    },
    {
      title: t('oauth.client.metaContact'),
      items: [
        {
          label: t('oauth.client.contacts'),
          value: contacts.length ? <ClickToCopy>{(contacts || []).join(', ')}</ClickToCopy> : '-',
        },
        { label: t('oauth.client.tosUri'), value: tosUri ? <ClickToCopy>{tosUri}</ClickToCopy> : '-' },
        { label: t('oauth.client.policyUri'), value: policyUri ? <ClickToCopy>{policyUri}</ClickToCopy> : '-' },
        { label: t('oauth.client.jwksUri'), value: jwksUri },
        { label: t('oauth.client.jwks'), value: jwks },
        { label: t('oauth.client.softwareId'), value: softwareId },
        { label: t('oauth.client.softwareVersion'), value: softwareVersion },
      ],
    },
    {
      title: t('common.timeInfo'),
      items: [
        {
          label: t('oauth.client.clientIdIssuedAt'),
          value: clientIdIssuedAt ? <RelativeTime value={clientIdIssuedAt * 1000} type="all" locale={locale} /> : '-',
        },
        {
          label: t('oauth.client.clientSecretExpiresAt'),
          value: clientSecretExpiresAt ? (
            <RelativeTime value={clientSecretExpiresAt * 1000} type="all" locale={locale} />
          ) : (
            '-'
          ),
        },
        {
          label: t('common.updatedAt'),
          value: updatedAt ? <RelativeTime value={updatedAt} type="all" locale={locale} /> : '-',
        },
      ],
    },
  ].filter(Boolean);

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {t('oauth.client.oauthAppDetails')}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            mt: 1,
          }}>
          {groups.map((g, i) => (
            <Box key={g.title}>
              <InfoGroup title={g.title} items={g.items} />
              {i !== groups.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

OauthClientDetail.propTypes = {
  client: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
