import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Close } from '@mui/icons-material';
import {
  IconButton,
  styled,
  Chip,
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
  Drawer,
} from '@mui/material';
import { useRequest } from 'ahooks';
import Toast from '@arcblock/ux/lib/Toast';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useNodeContext } from '../../contexts/node';
import ClickToCopy from '../../click-to-copy';
import ConfirmDialog from '../../confirm';
import InfoMetric from './components/info-metric';
import SectionHeader from './components/header';
import WebhookAttempts from './components/attempts';
import { getWebhookStatusColor, formatTime } from './util';
import { useTeamContext } from '../../contexts/team';

function WebhookDetail({ id, onClose }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [newSecret, setNewSecret] = useState(null);

  const { loading, error, data: result } = useRequest(() => api.getWebhookEndpoint({ input: { teamDid, id } }));
  const data = result?.data;

  const handleRegenerateSecret = async () => {
    try {
      const res = await api.regenerateWebhookEndpointSecret({ input: { teamDid, id } });
      setNewSecret(res.data?.secret || res.secret);
      setShowRegenerateConfirm(false);
    } catch (err) {
      Toast.error(err?.message);
    }
  };

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (loading || !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 1,
          width: 1,
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Root direction="column" sx={{ height: { xs: 'auto', md: 1 } }}>
      <Box>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Stack
            sx={{
              flex: 1,
              width: 0,
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}>
                {data.description}
              </Typography>

              <Tooltip title={data.url}>
                <InfoOutlinedIcon sx={{ fontSize: '16px', marginTop: '2px' }} />
              </Tooltip>
            </Box>
          </Stack>

          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
            }}>
            <IconButton edge="end" color="inherit" onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
        </Stack>

        <Box
          sx={{
            mt: 2,
          }}>
          <Stack
            className="section-body"
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 1, md: 3 }}
            sx={{
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              pt: 2,
              mt: 2,
              borderTop: '1px solid #eee',
            }}>
            <InfoMetric
              label={t('common.status')}
              value={
                <Chip
                  size="small"
                  variant="filled"
                  label={data.status}
                  color={getWebhookStatusColor(data.status)}
                  sx={{
                    borderRadius: '4px',
                    lineHeight: '20px',
                    textTransform: 'capitalize',
                  }}
                />
              }
              divider
            />
            <InfoMetric
              label={t('webhookEndpoint.listen')}
              value={
                <Tooltip
                  arrow
                  title={
                    <ul style={{ padding: 0, margin: 0 }}>
                      {data.enabledEvents.map((x) => (
                        <li key={x} style={{ fontSize: '0.7875rem' }}>
                          {x?.type}
                        </li>
                      ))}
                    </ul>
                  }>
                  <Chip
                    size="small"
                    variant="filled"
                    label={t('webhookEndpoint.eventsCount', { count: data.enabledEvents.length })}
                    sx={{
                      borderRadius: '4px',
                      lineHeight: '20px',
                      textTransform: 'capitalize',
                    }}
                  />
                </Tooltip>
              }
              divider
            />
            <InfoMetric label={t('webhookEndpoint.version')} value={data.apiVersion} divider />
            <InfoMetric label={t('common.createdAt')} value={formatTime(data.createdAt)} divider />
            <InfoMetric label={t('common.updatedAt')} value={formatTime(data.updatedAt)} divider />
            <InfoMetric
              label={t('common.createdBy')}
              value={
                <Tooltip arrow title={data.createUser?.did}>
                  <Chip
                    size="small"
                    variant="filled"
                    label={data.createUser?.fullName}
                    sx={{
                      borderRadius: '4px',
                      lineHeight: '20px',
                      textTransform: 'capitalize',
                    }}
                  />
                </Tooltip>
              }
              divider
            />
            <InfoMetric
              label={t('common.updatedBy')}
              value={
                <Tooltip arrow title={data.updateUser?.did}>
                  <Chip
                    size="small"
                    variant="filled"
                    label={data.updateUser?.fullName}
                    sx={{
                      borderRadius: '4px',
                      lineHeight: '20px',
                      textTransform: 'capitalize',
                    }}
                  />
                </Tooltip>
              }
            />
          </Stack>

          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('webhookEndpoint.secret')}
            </Typography>
            {newSecret ? (
              <Box>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  {t('webhookEndpoint.secretWarning')}
                </Alert>
                <ClickToCopy>
                  <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {newSecret}
                  </Typography>
                </ClickToCopy>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {data.secret ? (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {data.secret}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('webhookEndpoint.noSecret')}
                  </Typography>
                )}
                <Button size="small" startIcon={<RefreshIcon />} onClick={() => setShowRegenerateConfirm(true)}>
                  {t('webhookEndpoint.regenerateSecret')}
                </Button>
              </Box>
            )}
          </Box>

          {showRegenerateConfirm && (
            <ConfirmDialog
              title={t('webhookEndpoint.regenerateSecret')}
              description={t('webhookEndpoint.regenerateSecretConfirm')}
              confirm={t('webhookEndpoint.regenerateSecret')}
              color="warning"
              onCancel={() => setShowRegenerateConfirm(false)}
              onConfirm={handleRegenerateSecret}
            />
          )}
        </Box>
      </Box>
      <Stack
        className="section"
        sx={{
          flex: 1,
          height: 0,
          overflow: 'hidden',
        }}>
        <SectionHeader title={t('webhookEndpoint.attempts')} mb={0} mt={4} />
        <Stack
          sx={{
            height: 0,
            flex: 1,
            overflow: 'hidden',
          }}>
          <WebhookAttempts webhookEndpointId={data.id} />
        </Stack>
      </Stack>
    </Root>
  );
}

WebhookDetail.propTypes = {
  id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

const Root = styled(Stack)``;

export default function WebhookDetailModal({ open, onClose, id }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '90vw',
            maxWidth: '1200px',
          },
        },
      }}>
      <Box sx={{ height: '100vh', p: 3 }}>
        <WebhookDetail id={id} onClose={onClose} />
      </Box>
    </Drawer>
  );
}

WebhookDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};
