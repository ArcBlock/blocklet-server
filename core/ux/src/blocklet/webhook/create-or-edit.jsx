import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import Toast from '@arcblock/ux/lib/Toast';

import {
  Button,
  Dialog,
  useMediaQuery,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Checkbox,
  Box,
  List,
  ListItem,
  Collapse,
  Typography,
  IconButton,
  Chip,
  FormHelperText,
  Avatar,
  Alert,
  CircularProgress,
  FormControlLabel,
  useTheme,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { joinURL } from 'ufo';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import ClickToCopy from '../../click-to-copy';

const useOpenEvent = (initialData) => {
  const [openEvent, setOpenEvent] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  const site = window.blocklet?.appUrl;

  const eventsBySource = useMemo(() => {
    const result = {};

    if (openEvent) {
      openEvent.sources.forEach((source) => {
        result[source.did] = {
          source,
          events: [],
          count: 0,
        };
      });

      openEvent.events.forEach((event) => {
        if (result[event.source]) {
          result[event.source].events.push(event);
          result[event.source].count += 1;
        }
      });
    }

    return result;
  }, [openEvent]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!site) return;
      const response = await fetch(joinURL(site, WELLKNOWN_SERVICE_PATH_PREFIX, '/openevent.json'));
      const data = await response.json();
      setOpenEvent(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  return {
    openEvent,
    setOpenEvent,
    eventsBySource,
    loading,
    error,
    loadData,
  };
};

function EventSelector({ eventsBySource, selectedEvents, setSelectedEvents, error = null }) {
  const { t } = useLocaleContext();
  const [expandedSources, setExpandedSources] = useState({});

  const selectedCounts = useMemo(() => {
    const counts = {};

    Object.entries(eventsBySource).forEach(([sourceDid, { events }]) => {
      const count = events.filter((event) => selectedEvents[`${event.type}-${event.source}`]).length;
      counts[sourceDid] = count;
    });

    return counts;
  }, [eventsBySource, selectedEvents]);

  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedCounts).reduce((sum, count) => sum + count, 0);
  }, [selectedCounts]);

  const totalEventCount = useMemo(() => {
    return Object.values(eventsBySource).reduce((sum, { events }) => sum + events.length, 0);
  }, [eventsBySource]);

  const handleToggleSource = (did, event) => {
    event.stopPropagation();

    setExpandedSources({ ...expandedSources, [did]: !expandedSources[did] });
  };

  const handleToggleEvent = (event) => {
    const key = `${event.type}-${event.source}`;
    setSelectedEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllForSource = (events, isSelected) => {
    const updates = {};
    events.forEach((event) => {
      const key = `${event.type}-${event.source}`;
      updates[key] = !isSelected;
    });

    setSelectedEvents((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectAll = (e) => {
    const newState = {};
    Object.values(eventsBySource).forEach(({ events }) => {
      events.forEach((event) => {
        const key = `${event.type}-${event.source}`;
        newState[key] = e.target.checked;
      });
    });
    setSelectedEvents(newState);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              onChange={handleSelectAll}
              checked={totalSelectedCount > 0 && totalSelectedCount === totalEventCount}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {t('webhookEndpoint.selectAllEvents')}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title={t('webhookEndpoint.selectAllEventsTooltip')} placement="right">
                  <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5, cursor: 'help' }} />
                </Tooltip>
              </Box>
            </Box>
          }
          sx={{ m: 0 }}
        />

        {totalSelectedCount > 0 && (
          <Typography variant="body2" color="primary" sx={{ ml: 'auto' }}>
            {t('webhookEndpoint.selectedEventsCount', { count: totalSelectedCount })}
          </Typography>
        )}
      </Box>
      <Box className="webhook-event-selector" sx={{ maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <List disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
          {Object.entries(eventsBySource).map(([did, { source, events, count }], index) => {
            const isSelected = selectedCounts[did] > 0;
            const isAllSelected = selectedCounts[did] === events.length && events.length > 0;
            const isExpanded = expandedSources[did];

            return (
              <React.Fragment key={did}>
                <ListItem
                  sx={{
                    borderBottom: ({ palette }) =>
                      index < Object.keys(eventsBySource).length - 1 ? `1px solid ${palette.divider}` : 'none',
                    px: 0,
                    py: 1,
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                  }}>
                  <Box
                    sx={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={(e) => {
                      if (!e.target.closest('.MuiFormControlLabel-root')) {
                        handleToggleSource(did, e);
                      }
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {events.length > 0 && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isAllSelected}
                              indeterminate={isSelected && !isAllSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectAllForSource(events, isAllSelected);
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {source.logo && <Avatar src={source.logo} sx={{ width: 24, height: 24 }} />}
                              <Box>{source.title || did}</Box>
                              {isSelected && (
                                <Chip
                                  label={t('webhookEndpoint.selectedCount', { count: selectedCounts[did] })}
                                  size="small"
                                  sx={{
                                    mt: '2px',
                                    height: '20px',
                                    fontSize: '12px',
                                    bgcolor: (theme) => `${theme.palette.primary.main}20`,
                                    color: 'primary.main',
                                    fontWeight: 500,
                                  }}
                                />
                              )}
                            </Box>
                          }
                          sx={{
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              flex: 1,
                            },
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          mr: 1,
                        }}>
                        {t('webhookEndpoint.eventsCount', { count })}
                      </Typography>
                      {events.length > 0 && (
                        <IconButton size="small" edge="end">
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {events.length > 0 && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ p: 0, bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
                      {events.map((event) => {
                        const key = `${event.type}-${event.source}`;
                        const isChecked = !!selectedEvents[key];

                        return (
                          <ListItem key={key} dense sx={{ py: 0.75, px: 1 }} onClick={() => handleToggleEvent(event)}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                              <Checkbox checked={isChecked} sx={{ flexShrink: 0 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body1"
                                  className="webhook-event-type"
                                  sx={{
                                    cursor: 'pointer',
                                    color: 'text.primary',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                  }}>
                                  {event.type}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                    cursor: 'pointer',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                  }}>
                                  {event.description}
                                </Typography>
                              </Box>
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
      {error && (
        <FormHelperText error sx={{ mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}

EventSelector.propTypes = {
  eventsBySource: PropTypes.objectOf(
    PropTypes.shape({
      source: PropTypes.shape({
        did: PropTypes.string.isRequired,
        title: PropTypes.string,
        description: PropTypes.string,
        version: PropTypes.string,
        logo: PropTypes.string,
      }).isRequired,
      events: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired,
          source: PropTypes.string.isRequired,
        })
      ).isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
  selectedEvents: PropTypes.objectOf(PropTypes.bool).isRequired,
  setSelectedEvents: PropTypes.func.isRequired,
  error: PropTypes.string,
};

function CreateOrEditHook({ id = null, url = '', description = '', enabledEvents = [], onSubmit, onClose = () => {} }) {
  const { t } = useLocaleContext();
  const [selectedEvents, setSelectedEvents] = useState({});
  const [createdSecret, setCreatedSecret] = useState(null);
  const { teamDid } = useTeamContext();
  const { api } = useNodeContext();
  const { loading, error, eventsBySource } = useOpenEvent();
  const theme = useTheme();

  const {
    control,
    handleSubmit: validateSubmit,
    formState: { errors },
    reset,
    setValue,
    trigger,
  } = useForm({ defaultValues: { url: '', description: '' } });

  const isBreakpointsDownSm = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const hasSelectedEvents = Object.values(selectedEvents).some((value) => value);
    setValue('selectedEvents', hasSelectedEvents ? 'valid' : '');
    trigger('selectedEvents');
  }, [selectedEvents, setValue, trigger]);

  const handleClose = () => {
    setSelectedEvents({});
    reset();
    onClose();
  };

  const onFormSubmit = async (data) => {
    const selectedEventTypes = Object.keys(selectedEvents).filter((key) => selectedEvents[key]);

    const submitData = {
      url: data.url,
      description: data.description,
      enabledEvents: selectedEventTypes
        .map((key) => {
          const [type, source] = key.split('-');
          if (!type || !source) return null;
          return { type, source };
        })
        .filter(Boolean),
    };

    try {
      if (id) {
        const res = await api.updateWebhookEndpoint({ input: { teamDid, id, data: submitData } });
        Toast.success(`${t('webhookEndpoint.updateWebhook')} ${t('webhookEndpoint.success')}`);
        onSubmit(res);
        handleClose();
      } else {
        const res = await api.createWebhookEndpoint({ input: { teamDid, input: submitData } });
        Toast.success(`${t('webhookEndpoint.createWebhook')} ${t('webhookEndpoint.success')}`);
        const secret = res.data?.secret || res.secret;
        if (secret) {
          setCreatedSecret(secret);
        }
        onSubmit(res);
      }
    } catch (err) {
      Toast.error(err?.message);
    }
  };

  useEffect(() => {
    reset({ url, description });

    setSelectedEvents(
      enabledEvents.reduce((acc, event) => {
        acc[`${event.type}-${event.source}`] = true;
        return acc;
      }, {})
    );
  }, [reset, setSelectedEvents, url, description, enabledEvents]);

  if (createdSecret) {
    return (
      <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('webhookEndpoint.secret')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">{t('webhookEndpoint.secretWarning')}</Alert>
            <ClickToCopy>
              <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {createdSecret}
              </Typography>
            </ClickToCopy>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '8px 24px 24px' }}>
          <Button variant="contained" onClick={handleClose}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={handleClose} maxWidth="lg" fullWidth fullScreen={isBreakpointsDownSm}>
      <form onSubmit={validateSubmit(onFormSubmit)}>
        <DialogTitle>
          {id ? t('webhookEndpoint.editWebhookTitle') : t('webhookEndpoint.createWebhookTitle')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Controller
              name="url"
              control={control}
              rules={{
                required: t('webhookEndpoint.validation.urlRequired'),
                pattern: {
                  value: /^(http|https):\/\/[^ "]+$/,
                  message: t('webhookEndpoint.validation.urlInvalid'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('webhookEndpoint.url.label')}
                  fullWidth
                  error={!!errors.url}
                  helperText={errors.url?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              rules={{ required: t('webhookEndpoint.validation.descriptionRequired') }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('webhookEndpoint.description.label')}
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Controller
              name="selectedEvents"
              control={control}
              rules={{
                required: t('webhookEndpoint.validation.eventRequired'),
              }}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {!loading && eventsBySource && Object.keys(eventsBySource).length > 0 && (
              <EventSelector
                eventsBySource={eventsBySource}
                selectedEvents={selectedEvents}
                setSelectedEvents={setSelectedEvents}
                error={errors.selectedEvents?.message}
              />
            )}

            {!loading && (!eventsBySource || Object.keys(eventsBySource).length === 0) && (
              <Typography
                sx={{
                  color: 'text.secondary',
                }}>
                {t('webhookEndpoint.noAvailableEvents')}
              </Typography>
            )}

            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '500px',
                  width: '100%',
                }}>
                <CircularProgress size={20} />
              </Box>
            )}

            {error && <Alert severity="error">{t('webhookEndpoint.loadingError', { message: error?.message })}</Alert>}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: '8px 24px 24px' }}>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>

          <Button type="submit" variant="contained" color="primary">
            {id ? t('webhookEndpoint.updateWebhook') : t('webhookEndpoint.saveWebhook')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

CreateOrEditHook.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  id: PropTypes.string,
  url: PropTypes.string,
  description: PropTypes.string,
  enabledEvents: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
    })
  ),
  onClose: PropTypes.func,
};

export default CreateOrEditHook;
