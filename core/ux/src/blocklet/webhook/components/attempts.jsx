/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlined from '@mui/icons-material/ErrorOutlined';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
  IconButton,
  styled,
  Tooltip,
  Divider,
} from '@mui/material';
import { Icon } from '@iconify/react';
import ShareIcon from '@iconify-icons/tabler/external-link';
import RefreshIcon from '@iconify-icons/tabler/refresh';
import { useInfiniteScroll } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { EVENTS } from '@abtnode/constant';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import { joinURL, withQuery } from 'ufo';

import { isSuccessAttempt, formatTime } from '../util';
import { useNodeContext } from '../../../contexts/node';
import { useTeamContext } from '../../../contexts/team';
import { useBlockletContext } from '../../../contexts/blocklet';

const groupAttemptsByDate = (attempts) => {
  const groupedAttempts = {};
  attempts.forEach((attempt) => {
    const date = new Date(attempt.createdAt).toLocaleDateString();
    if (!groupedAttempts[date]) {
      groupedAttempts[date] = [];
    }
    groupedAttempts[date]?.push(attempt);
  });
  return groupedAttempts;
};

export default function WebhookAttempts({ eventId = '', webhookEndpointId = '', event = null }) {
  const {
    api,
    ws: { useSubscription },
  } = useNodeContext();
  const { t } = useLocaleContext();
  const { teamDid } = useTeamContext();
  const { blocklet } = useBlockletContext();

  const { data, loadMore, loadingMore, loading, mutate } = useInfiniteScroll(
    (d) => {
      const size = 15;
      const page = d ? Math.ceil(d.list.length / size) + 1 : 1;

      return api.getWebhookAttempts({
        input: {
          teamDid,
          input: { eventId, webhookId: webhookEndpointId },
          paging: { page, pageSize: size },
        },
      });
    },
    { reloadDeps: [eventId, webhookEndpointId] }
  );

  const attempts = data?.list || [];

  const [selected, setSelected] = useState(null);
  const [retryAttemptLoading, setRetryAttemptLoading] = useState(false);
  const groupedAttempts = groupAttemptsByDate(attempts);

  useEffect(() => {
    if (!selected && data?.list.length) {
      setSelected(data.list[0]);
    }
  }, [data?.list.length, selected]); // eslint-disable-line

  useSubscription(
    EVENTS.WEBHOOK_ATTEMPT,
    (attempt) => {
      mutate((d) => {
        const found = d.list.find((item) => item.id === attempt.id);

        if (found) {
          const list = d.list.map((item) => {
            if (item.id === attempt.id) {
              return { ...item, ...attempt };
            }
            return item;
          });

          return { ...d, list };
        }

        attempt.endpoint = d.list[0]?.endpoint;
        attempt.event = d.list[0]?.event;

        return { ...d, list: [attempt, ...d.list] };
      });
    },
    []
  );

  if (loading) {
    return <CircularProgress />;
  }

  const hasMore = data && data.list.length < data.paging.total;

  const handleRetry = async () => {
    if (!selected) {
      return;
    }

    setRetryAttemptLoading(true);
    await api
      .retryWebhookAttempt({
        input: {
          teamDid,
          eventId: selected.event.id,
          webhookId: webhookEndpointId,
          attemptId: selected.id,
        },
      })
      .finally(() => {
        setTimeout(() => {
          setRetryAttemptLoading(false);
        }, 1000);
      });
  };

  const renderLog = (attempt) => {
    if (
      attempt.responseBody &&
      attempt.responseBody?.sessionId &&
      attempt.responseBody?.projectId &&
      attempt.responseBody?.agentId
    ) {
      const site = blocklet?.site?.domainAliases[0]?.value;

      const mountPoint = (blocklet.children || []).find((item) => item?.meta?.name === 'ai-studio');

      const logUrl = withQuery(
        joinURL(
          `https://${site}`,
          mountPoint?.mountPoint || '',
          'projects',
          attempt.responseBody.projectId,
          'logs/main'
        ),
        {
          sessionId: attempt.responseBody.sessionId,
          agentId: attempt.responseBody.agentId,
        }
      );

      return (
        <IconButton sx={{ fontSize: 20 }} onClick={() => window.open(logUrl, '_blank')}>
          <Box component={Icon} icon={ShareIcon} />
        </IconButton>
      );
    }

    return null;
  };

  const renderIcon = (attempt) => {
    if (attempt.status === 'pending') {
      return <PendingIcon color="warning" />;
    }

    if (isSuccessAttempt(attempt.responseStatus)) {
      return <CheckCircleOutlined color="success" />;
    }

    return <ErrorOutlined color="error" />;
  };

  const foundTriggeredFrom =
    selected?.triggeredFrom && (data?.list || []).find((item) => item.id === selected.triggeredFrom);

  return (
    <Container container spacing={{ xs: 0, md: 1 }} sx={{ height: 1 }}>
      <Grid
        size={{
          xs: 12,
          md: 4,
        }}
        sx={{
          height: 1,
        }}>
        {isEmpty(Object.keys(groupedAttempts)) ? (
          <Typography
            sx={{
              color: 'text.secondary',
            }}>
            {t('webhookEndpoint.waitingForEvents')}
          </Typography>
        ) : (
          <>
            <List sx={{ maxHeight: 'calc(100% - 40px)', py: 0, overflowY: 'auto' }}>
              {Object.entries(groupedAttempts).map(([date, items]) => (
                <React.Fragment key={date}>
                  <ListSubheader sx={{ p: 0 }}>{date}</ListSubheader>

                  {items.map((attempt) => (
                    <ListItem
                      sx={{ cursor: 'pointer', px: 1 }}
                      key={attempt.id}
                      onClick={() => setSelected(attempt)}
                      selected={selected && selected?.id === attempt?.id}
                      secondaryAction={
                        <Typography
                          sx={{
                            color: 'text.secondary',
                          }}>
                          {formatTime(attempt.createdAt, 'HH:mm:ss')}
                        </Typography>
                      }>
                      <ListItemIcon sx={{ minWidth: 0, mr: 1.5 }}>{renderIcon(attempt)}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              color: 'text.primary',
                            }}>
                            {attempt.event.type}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </React.Fragment>
              ))}
            </List>

            {hasMore && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 1,
                }}>
                <Button
                  variant="text"
                  type="button"
                  color="inherit"
                  onClick={loadMore}
                  disabled={loadingMore}
                  sx={{ color: (theme) => theme.palette.text.disabled }}>
                  {loadingMore ? t('webhookEndpoint.loadingMore') : t('webhookEndpoint.loadMore')}
                </Button>
              </Box>
            )}
          </>
        )}
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 8,
        }}
        sx={{
          height: 1,
        }}>
        {selected && (
          <Stack
            direction="column"
            spacing={2}
            sx={{
              height: 1,
              overflow: 'auto',
              pl: { xs: 0, md: 1 },
              mt: { xs: 2, md: 0 },
              borderLeft: { xs: 'none' },
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4">{t(`common.${selected.status}`)}</Typography>
                <Box>{renderLog(selected)}</Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {foundTriggeredFrom && (
                  <Tooltip
                    placement="left"
                    title={
                      <Stack
                        onClick={() => setSelected(foundTriggeredFrom)}
                        sx={{
                          gap: 1,
                          cursor: 'pointer',
                          '.did-address-text': { color: 'common.white' },
                        }}>
                        <UserCard
                          showDid
                          did={selected.triggeredBy}
                          cardType={CardType.Detailed}
                          infoType={InfoType.Minimal}
                          sx={{
                            border: 0,
                            padding: 0,
                            minWidth: 0,
                            '.MuiTypography-root': {
                              color: 'common.white',
                              fontWeight: 400,
                            },
                          }}
                        />

                        <Divider />

                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ color: 'primary.main' }}>
                            {t('webhookEndpoint.triggeredFrom')}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{selected.id}</Typography>
                            <IconButton onClick={() => setSelected(foundTriggeredFrom)}>
                              <Box component={Icon} icon={ShareIcon} sx={{ fontSize: 16, color: 'common.white' }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Stack>
                    }
                    slotProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 400,
                        },
                      },
                    }}>
                    <IconButton onClick={() => setSelected(foundTriggeredFrom)}>
                      <Box component={Icon} icon={ShareIcon} sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}

                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleRetry}
                  disabled={retryAttemptLoading}>
                  <Box
                    component={Icon}
                    icon={RefreshIcon}
                    sx={{ fontSize: 16, animation: retryAttemptLoading ? 'spin 1s linear infinite' : 'none', mr: 0.5 }}
                  />
                  {t('notification.resend')}
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6">
                {t('webhookEndpoint.response')} ({selected.responseStatus})
              </Typography>
              <CodeBlock language="json">{JSON.stringify(selected.responseBody, null, 2)}</CodeBlock>
            </Box>
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                }}>
                <Typography variant="h6">{t('webhookEndpoint.request')}</Typography>
              </Stack>
              <CodeBlock language="json" sx={{ margin: 0 }}>
                {JSON.stringify(selected.event, null, 2)}
              </CodeBlock>
            </Box>
          </Stack>
        )}

        {data?.list.length === 0 && event && (
          <Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
              }}>
              <Typography variant="h6">{t('webhookEndpoint.eventData')}</Typography>
            </Stack>
            <CodeBlock language="json" sx={{ margin: 0 }}>
              {JSON.stringify(event.data, null, 2)}
            </CodeBlock>
          </Box>
        )}
      </Grid>
    </Container>
  );
}

WebhookAttempts.propTypes = {
  eventId: PropTypes.string,
  webhookEndpointId: PropTypes.string,
  event: PropTypes.shape({
    type: PropTypes.string,
    data: PropTypes.object,
    request: PropTypes.object,
    requestInfo: PropTypes.object,
  }),
};

const Container = styled(Grid)`
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
