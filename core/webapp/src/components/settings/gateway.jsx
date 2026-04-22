import React, { useState } from 'react';
import styled from '@emotion/styled';
import isIp from 'is-ip';
import isIpRange from 'is-cidr';
import isUrl from 'is-url';
import { useForm, Controller } from 'react-hook-form';
import prettyMs from 'pretty-ms-i18n';
import { formatLocale } from '@abtnode/ux/lib/util';

import Toast from '@arcblock/ux/lib/Toast';
import {
  GATEWAY_RATE_LIMIT,
  GATEWAY_RATE_LIMIT_GLOBAL,
  GATEWAY_RATE_LIMIT_METHODS,
  GATEWAY_RATE_LIMIT_BURST_FACTOR,
} from '@abtnode/constant';

import Button from '@arcblock/ux/lib/Button';
import Spinner from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';

import SwitchControl from '@abtnode/ux/lib/blocklet/component/switch-control';
import { mergeSx } from '@arcblock/ux/lib/Util/style';

import Permission from '../permission';

import { useNodeContext } from '../../contexts/node';

import { formatError, sleep } from '../../libs/util';
import Form from '../node/form';

function LimitRateSlider(props) {
  return (
    <Slider
      {...props}
      sx={mergeSx(
        theme => ({
          '.MuiSlider-root': {
            color: theme.palette.primary.main,
            height: 8,
            marginLeft: 8,
          },
          '.MuiSlider-thumb': {
            height: 24,
            width: 24,
            backgroundColor: '#fff',
            border: '2px solid currentColor',
            '&:focus, &:hover, &$active': {
              boxShadow: 'inherit',
            },
          },
          '.MuiSlider-valueLabel': {
            left: 'calc(-50% + 4px)',
          },
          '.MuiSlider-track': {
            height: 8,
            borderRadius: 4,
          },
          '.MuiSlider-rail': {
            height: 8,
            borderRadius: 4,
          },
        }),
        // eslint-disable-next-line react/prop-types
        props.sx
      )}
    />
  );
}

export default function Gateway() {
  const {
    info: { routing },
    api,
  } = useNodeContext();
  const { t, locale } = useLocaleContext();
  const [loading, setLoading] = useState(false);

  // request limiting
  const limit = routing.requestLimit || {};
  if (typeof limit.enabled !== 'boolean') {
    limit.enabled = false;
  }
  if (typeof limit.rate !== 'number') {
    limit.rate = GATEWAY_RATE_LIMIT.min;
  }
  if (typeof limit.global !== 'number') {
    limit.global = GATEWAY_RATE_LIMIT_GLOBAL.min;
  }
  if (typeof limit.burstFactor !== 'number') {
    limit.burstFactor = 2;
  }
  if (typeof limit.burstDelay !== 'number') {
    limit.burstDelay = 0;
  }
  if (!Array.isArray(limit.methods)) {
    limit.methods = GATEWAY_RATE_LIMIT_METHODS;
  }

  const blockPolicy = routing.blockPolicy || {};
  if (typeof blockPolicy.enabled !== 'boolean') {
    blockPolicy.enabled = false;
  }
  if (!blockPolicy.blacklist) {
    blockPolicy.blacklist = [];
  }
  if (!blockPolicy.autoBlocking) {
    blockPolicy.autoBlocking = {
      enabled: false,
      windowSize: 1,
      windowQuota: 5,
      statusCodes: [403, 429],
      blockDuration: 3600,
    };
  } else if (!Array.isArray(blockPolicy.autoBlocking.statusCodes)) {
    blockPolicy.autoBlocking.statusCodes = blockPolicy.autoBlocking.statusCodes
      ? [blockPolicy.autoBlocking.statusCodes]
      : [403];
  }

  const proxyPolicy = routing.proxyPolicy || {};
  if (typeof proxyPolicy.enabled !== 'boolean') {
    proxyPolicy.enabled = false;
  }
  if (typeof proxyPolicy.trustRecursive !== 'boolean') {
    proxyPolicy.trustRecursive = false;
  }
  if (!proxyPolicy.trustedProxies) {
    proxyPolicy.trustedProxies = ['0.0.0.0/0'];
  }
  if (!proxyPolicy.realIpHeader) {
    proxyPolicy.realIpHeader = 'X-Forwarded-For';
  }

  const wafPolicy = routing.wafPolicy || {};
  if (typeof wafPolicy.enabled !== 'boolean') {
    wafPolicy.enabled = false;
  }
  if (!wafPolicy.mode) {
    wafPolicy.mode = 'DetectionOnly';
  }
  if (!wafPolicy.inboundAnomalyScoreThreshold) {
    wafPolicy.inboundAnomalyScoreThreshold = 20;
  }
  if (!wafPolicy.outboundAnomalyScoreThreshold) {
    wafPolicy.outboundAnomalyScoreThreshold = 10;
  }
  if (!wafPolicy.logLevel) {
    wafPolicy.logLevel = 0;
  }

  const { handleSubmit, control, watch } = useForm({
    defaultValues: {
      requestLimit: limit,
      blockPolicy,
      proxyPolicy,
      cacheEnabled: typeof routing.cacheEnabled === 'boolean' ? routing.cacheEnabled : true,
      wafPolicy,
    },
  });

  const limitEnabled = watch('requestLimit.enabled');
  const limitRate = watch('requestLimit.rate');
  const limitGlobal = watch('requestLimit.global');
  const limitBurstFactor = watch('requestLimit.burstFactor');
  const limitBurstDelay = watch('requestLimit.burstDelay');
  const blockPolicyEnabled = watch('blockPolicy.enabled');
  const autoBlockingEnabled = watch('blockPolicy.autoBlocking.enabled');
  const proxyPolicyEnabled = watch('proxyPolicy.enabled');
  const proxyTrustRecursive = watch('proxyPolicy.trustRecursive');
  const wafPolicyEnabled = watch('wafPolicy.enabled');

  const onSubmit = async data => {
    try {
      setLoading(true);

      // validate the blacklist
      const { blacklist } = data.blockPolicy;
      blacklist.forEach(item => {
        if (!isIp.v4(item) && !isIpRange.v4(item) && !isUrl(item) && !isIp.v6(item) && !isIpRange.v6(item)) {
          throw new Error(t('router.gateway.blockPolicy.invalidItem'));
        }
      });

      // validate the trusted proxies
      const { trustedProxies } = data.proxyPolicy;
      trustedProxies.forEach(item => {
        if (!isIp.v4(item) && !isIpRange.v4(item) && !isIp.v6(item) && !isIpRange.v6(item)) {
          throw new Error(t('router.gateway.proxyPolicy.invalidItem'));
        }
      });

      await api.updateGateway({ input: data });
      await sleep(1000);
      Toast.success(t('common.saveSuccess'));
    } catch (err) {
      Toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Div>
      <Permission permission="mutate_node">
        {hasPermission => (
          <Form className="form" noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <Stack className="gateway-section" direction={{ sm: 'column', md: 'row' }} spacing={2}>
              <Typography className="gateway-section-title">{t('router.gateway.cacheEnabled.title')}</Typography>
              <Controller
                name="cacheEnabled"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <SwitchControl
                    checked={value}
                    disabled={!hasPermission}
                    onChange={e => onChange(e.target.checked)}
                    labelProps={{
                      label: <Typography>{t('router.gateway.cacheEnabled.switchLabel')}</Typography>,
                      labelPlacement: 'end',
                    }}
                  />
                )}
              />
            </Stack>
            <Stack className="gateway-section" direction={{ sm: 'column', md: 'row' }} spacing={2}>
              <Typography className="gateway-section-title">{t('router.gateway.reqLimit.title')}</Typography>
              <Stack className="gateway-section-content" direction="column" spacing={2} sx={{ width: '100%' }}>
                <Controller
                  name="requestLimit.enabled"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <SwitchControl
                      checked={value}
                      disabled={!hasPermission}
                      onChange={e => onChange(e.target.checked)}
                      labelProps={{
                        label: <Typography>{t('router.gateway.reqLimit.switchLabel')}</Typography>,
                        labelPlacement: 'end',
                      }}
                    />
                  )}
                />
                {limitEnabled && (
                  <>
                    <Box>
                      <FormHelperText id="request-limit-global-desc">
                        {t('router.gateway.reqLimit.global', { global: limitGlobal })}
                      </FormHelperText>
                      <Controller
                        name="requestLimit.global"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <LimitRateSlider
                            disabled={!hasPermission}
                            onChange={(_, newValue) => onChange(newValue)}
                            defaultValue={value}
                            valueLabelDisplay="auto"
                            step={10}
                            min={GATEWAY_RATE_LIMIT_GLOBAL.min}
                            max={GATEWAY_RATE_LIMIT_GLOBAL.max}
                          />
                        )}
                      />
                    </Box>
                    <Box className="form-item" sx={{ width: '100%' }}>
                      <FormHelperText id="request-limit-burst-factor-desc">
                        {t('router.gateway.reqLimit.burstFactor', {
                          rate: Math.round(limitRate * limitBurstFactor),
                          global: Math.round(limitGlobal * limitBurstFactor),
                        })}
                      </FormHelperText>
                      <Controller
                        name="requestLimit.burstFactor"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <LimitRateSlider
                            disabled={!hasPermission}
                            onChange={(_, newValue) => onChange(newValue)}
                            defaultValue={value}
                            valueLabelDisplay="auto"
                            step={0.1}
                            min={GATEWAY_RATE_LIMIT_BURST_FACTOR.min}
                            max={GATEWAY_RATE_LIMIT_BURST_FACTOR.max}
                          />
                        )}
                      />
                    </Box>
                    <Box className="form-item" sx={{ width: '100%' }}>
                      <FormHelperText id="request-limit-burst-delay-desc">
                        {t('router.gateway.reqLimit.burstDelay', { delay: limitBurstDelay })}
                      </FormHelperText>
                      <Controller
                        name="requestLimit.burstDelay"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <LimitRateSlider
                            disabled={!hasPermission}
                            onChange={(_, newValue) => onChange(newValue)}
                            defaultValue={value}
                            valueLabelDisplay="auto"
                            step={1}
                            min={0}
                            max={60}
                          />
                        )}
                      />
                    </Box>
                    <Box className="form-item" sx={{ width: '100%' }}>
                      <FormHelperText id="request-limit-rate-desc">
                        {t('router.gateway.reqLimit.rate', { rate: limitRate })}
                      </FormHelperText>
                      <Controller
                        name="requestLimit.rate"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <LimitRateSlider
                            disabled={!hasPermission}
                            onChange={(_, newValue) => onChange(newValue)}
                            defaultValue={value}
                            valueLabelDisplay="auto"
                            step={1}
                            min={GATEWAY_RATE_LIMIT.min}
                            max={GATEWAY_RATE_LIMIT.max}
                          />
                        )}
                      />
                    </Box>
                    <Box className="form-item" sx={{ width: '100%' }}>
                      <FormHelperText id="request-limit-methods-desc">
                        {t('router.gateway.reqLimit.methods')}
                      </FormHelperText>
                      <Controller
                        name="requestLimit.methods"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <FormGroup row>
                            {GATEWAY_RATE_LIMIT_METHODS.map(method => (
                              <FormControlLabel
                                key={method}
                                control={
                                  <Checkbox
                                    disabled={!hasPermission}
                                    checked={value.includes(method)}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        onChange([...value, method]);
                                      } else {
                                        onChange(value.filter(v => v !== method));
                                      }
                                    }}
                                  />
                                }
                                label={method}
                              />
                            ))}
                          </FormGroup>
                        )}
                      />
                    </Box>
                  </>
                )}
              </Stack>
            </Stack>
            <Stack className="gateway-section" direction={{ sm: 'column', md: 'row' }} spacing={2}>
              <Typography className="gateway-section-title">{t('router.gateway.blockPolicy.title')}</Typography>
              <Stack className="gateway-section-content" direction="column" spacing={2} sx={{ width: '100%' }}>
                <Controller
                  name="blockPolicy.enabled"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <SwitchControl
                      checked={value}
                      disabled={!hasPermission}
                      onChange={e => onChange(e.target.checked)}
                      labelProps={{
                        label: <Typography>{t('router.gateway.blockPolicy.switchLabel')}</Typography>,
                        labelPlacement: 'end',
                      }}
                    />
                  )}
                />
                {blockPolicyEnabled && (
                  <>
                    <Controller
                      name="blockPolicy.blacklist"
                      control={control}
                      render={({ field: { value, onChange } }) => {
                        const handleAdd = () => {
                          onChange([...(value || []), '']);
                        };

                        const handleRemove = index => {
                          const newValue = [...value];
                          newValue.splice(index, 1);
                          onChange(newValue);
                        };

                        const handleChange = (index, newValue) => {
                          const newValues = [...value];
                          newValues[index] = newValue;
                          onChange(newValues);
                        };

                        return (
                          <div style={{ width: '100%' }}>
                            <FormHelperText>{t('router.gateway.blockPolicy.blacklistDesc')}</FormHelperText>
                            {(value || []).map((item, index) => (
                              <div
                                // eslint-disable-next-line react/no-array-index-key
                                key={`blacklist-item-${index}`}
                                style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <TextField
                                  variant="outlined"
                                  size="small"
                                  disabled={loading || !hasPermission}
                                  style={{ flex: 1 }}
                                  value={item}
                                  onChange={e => handleChange(index, e.target.value)}
                                  placeholder={t('router.gateway.blockPolicy.inputPlaceholder')}
                                  slotProps={{
                                    input: {
                                      endAdornment: (
                                        <IconButton
                                          disabled={loading || !hasPermission}
                                          onClick={() => handleRemove(index)}
                                          size="small"
                                          color="error">
                                          <DeleteIcon />
                                        </IconButton>
                                      ),
                                    },
                                  }}
                                />
                              </div>
                            ))}
                            <Button
                              disabled={loading || !hasPermission}
                              onClick={handleAdd}
                              color="primary"
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon />}>
                              {t('router.gateway.blockPolicy.addItem')}
                            </Button>
                          </div>
                        );
                      }}
                    />
                    <Controller
                      name="blockPolicy.autoBlocking.enabled"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <SwitchControl
                          checked={value}
                          disabled={!hasPermission}
                          onChange={e => onChange(e.target.checked)}
                          labelProps={{
                            label: <Typography>{t('router.gateway.blockPolicy.autoBlocking.switchLabel')}</Typography>,
                            labelPlacement: 'end',
                          }}
                        />
                      )}
                    />
                    {autoBlockingEnabled && (
                      <>
                        <Controller
                          name="blockPolicy.autoBlocking.statusCodes"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Box>
                              <FormHelperText id="block-policy-auto-blocking-status-codes-desc">
                                {t('router.gateway.blockPolicy.autoBlocking.statusCodes')}
                              </FormHelperText>
                              <Select
                                variant="outlined"
                                fullWidth
                                size="small"
                                disabled={loading || !hasPermission}
                                multiple
                                value={value}
                                onChange={onChange}>
                                <MenuItem value={400}>400 Bad Request</MenuItem>
                                <MenuItem value={401}>401 Unauthorized</MenuItem>
                                <MenuItem value={403}>403 Forbidden (WAF)</MenuItem>
                                <MenuItem value={404}>404 Not Found</MenuItem>
                                <MenuItem value={429}>429 Too Many Requests</MenuItem>
                                <MenuItem value={405}>405 Method Not Allowed</MenuItem>
                              </Select>
                            </Box>
                          )}
                        />
                        <Controller
                          name="blockPolicy.autoBlocking.windowSize"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Box>
                              <FormHelperText id="block-policy-auto-blocking-window-size-desc">
                                {t('router.gateway.blockPolicy.autoBlocking.windowSize')}
                              </FormHelperText>
                              <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                disabled={loading || !hasPermission}
                                value={value}
                                onChange={onChange}
                                slotProps={{
                                  input: {
                                    endAdornment: (
                                      <Typography variant="body2">
                                        {prettyMs(Number(value * 1000), {
                                          locale: formatLocale(locale),
                                          long: true,
                                        })}{' '}
                                      </Typography>
                                    ),
                                  },
                                }}
                              />
                            </Box>
                          )}
                        />
                        <Controller
                          name="blockPolicy.autoBlocking.windowQuota"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Box>
                              <FormHelperText id="block-policy-auto-blocking-window-quota-desc">
                                {t('router.gateway.blockPolicy.autoBlocking.windowQuota')}
                              </FormHelperText>
                              <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                disabled={loading || !hasPermission}
                                value={value}
                                onChange={onChange}
                              />
                            </Box>
                          )}
                        />
                        <Controller
                          name="blockPolicy.autoBlocking.blockDuration"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Box>
                              <FormHelperText id="block-policy-auto-blocking-block-duration-desc">
                                {t('router.gateway.blockPolicy.autoBlocking.blockDuration')}
                              </FormHelperText>
                              <TextField
                                variant="outlined"
                                fullWidth
                                size="small"
                                disabled={loading || !hasPermission}
                                value={value}
                                onChange={onChange}
                                slotProps={{
                                  input: {
                                    endAdornment: (
                                      <Typography variant="body2">
                                        {prettyMs(Number(value * 1000), {
                                          locale: formatLocale(locale),
                                          long: true,
                                        })}
                                      </Typography>
                                    ),
                                  },
                                }}
                              />
                            </Box>
                          )}
                        />
                      </>
                    )}
                  </>
                )}
              </Stack>
            </Stack>
            <Stack className="gateway-section" direction={{ sm: 'column', md: 'row' }} spacing={2}>
              <Typography className="gateway-section-title">{t('router.gateway.proxyPolicy.title')}</Typography>
              <Stack className="gateway-section-content" direction="column" spacing={2} sx={{ width: '100%' }}>
                <Controller
                  name="proxyPolicy.enabled"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <SwitchControl
                      checked={value}
                      disabled={!hasPermission}
                      onChange={e => onChange(e.target.checked)}
                      labelProps={{
                        label: <Typography>{t('router.gateway.proxyPolicy.switchLabel')}</Typography>,
                        labelPlacement: 'end',
                      }}
                    />
                  )}
                />
                {proxyPolicyEnabled && (
                  <>
                    <Controller
                      name="proxyPolicy.realIpHeader"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Box>
                          <FormHelperText id="proxy-policy-real-ip-header-desc">
                            {t('router.gateway.proxyPolicy.realIpHeaderDesc')}
                          </FormHelperText>
                          <TextField
                            variant="outlined"
                            fullWidth
                            size="small"
                            disabled={loading || !hasPermission}
                            value={value}
                            onChange={onChange}
                          />
                        </Box>
                      )}
                    />
                    <Controller
                      name="proxyPolicy.trustRecursive"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Box sx={{ mt: 2 }}>
                          <FormHelperText id="proxy-policy-real-ip-header-desc">
                            {t('router.gateway.proxyPolicy.trustRecursiveDesc')}
                          </FormHelperText>
                          <SwitchControl
                            checked={value}
                            disabled={!hasPermission}
                            onChange={e => onChange(e.target.checked)}
                            labelProps={{
                              label: <Typography>{t('router.gateway.proxyPolicy.trustRecursive')}</Typography>,
                              labelPlacement: 'end',
                            }}
                          />
                        </Box>
                      )}
                    />
                    {proxyTrustRecursive && (
                      <Controller
                        name="proxyPolicy.trustedProxies"
                        control={control}
                        render={({ field: { value, onChange } }) => {
                          const handleAdd = () => {
                            onChange([...(value || []), '']);
                          };

                          const handleRemove = index => {
                            const newValue = [...value];
                            newValue.splice(index, 1);
                            onChange(newValue);
                          };

                          const handleChange = (index, newValue) => {
                            const newValues = [...value];
                            newValues[index] = newValue;
                            onChange(newValues);
                          };

                          return (
                            <Box sx={{ width: '100%', mt: 2 }}>
                              <FormHelperText>{t('router.gateway.proxyPolicy.trustedProxiesDesc')}</FormHelperText>
                              {(value || []).map((item, index) => (
                                <div
                                  // eslint-disable-next-line react/no-array-index-key
                                  key={`trusted-proxy-item-${index}`}
                                  style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                  <TextField
                                    variant="outlined"
                                    size="small"
                                    disabled={loading || !hasPermission}
                                    style={{ flex: 1 }}
                                    value={item}
                                    onChange={e => handleChange(index, e.target.value)}
                                    placeholder={t('router.gateway.proxyPolicy.inputPlaceholder')}
                                    slotProps={{
                                      input: {
                                        endAdornment: (
                                          <IconButton
                                            disabled={loading || !hasPermission}
                                            onClick={() => handleRemove(index)}
                                            size="small"
                                            color="error">
                                            <DeleteIcon />
                                          </IconButton>
                                        ),
                                      },
                                    }}
                                  />
                                </div>
                              ))}
                              <Button
                                disabled={loading || !hasPermission}
                                onClick={handleAdd}
                                color="primary"
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}>
                                {t('router.gateway.proxyPolicy.addItem')}
                              </Button>
                            </Box>
                          );
                        }}
                      />
                    )}
                  </>
                )}
              </Stack>
            </Stack>
            <Stack className="gateway-section" direction={{ sm: 'column', md: 'row' }} spacing={2}>
              <Typography className="gateway-section-title">{t('router.gateway.wafPolicy.title')}</Typography>
              <Stack className="gateway-section-content" direction="column" spacing={2} sx={{ width: '100%' }}>
                <Controller
                  name="wafPolicy.enabled"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <SwitchControl
                      checked={value}
                      disabled={!hasPermission}
                      onChange={e => onChange(e.target.checked)}
                      labelProps={{
                        label: <Typography>{t('router.gateway.wafPolicy.switchLabel')}</Typography>,
                        labelPlacement: 'end',
                      }}
                    />
                  )}
                />
                {wafPolicyEnabled && (
                  <>
                    <Controller
                      name="wafPolicy.mode"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Box>
                          <FormHelperText id="waf-policy-mode-desc">
                            {t('router.gateway.wafPolicy.modeDesc')}&nbsp;
                            <Link
                              href={`https://www.arcblock.io/docs/blocklet-developer/${locale}/enable-web-application-firewall`}
                              target="_blank">
                              {t('router.gateway.wafPolicy.docDesc')}
                            </Link>
                          </FormHelperText>
                          <Select
                            variant="outlined"
                            fullWidth
                            size="small"
                            disabled={loading || !hasPermission}
                            value={value}
                            onChange={onChange}>
                            <MenuItem value="DetectionOnly">{t('router.gateway.wafPolicy.mode.detectOnly')}</MenuItem>
                            <MenuItem value="On">{t('router.gateway.wafPolicy.mode.on')}</MenuItem>
                          </Select>
                        </Box>
                      )}
                    />
                    <Box>
                      <FormHelperText id="waf-policy-inbound-anomaly-score-threshold-desc">
                        {t('router.gateway.wafPolicy.inboundAnomalyScoreThresholdDesc')}
                      </FormHelperText>
                      <Controller
                        name="wafPolicy.inboundAnomalyScoreThreshold"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <LimitRateSlider
                            disabled={!hasPermission}
                            onChange={(_, newValue) => onChange(newValue)}
                            defaultValue={value}
                            valueLabelDisplay="auto"
                            step={1}
                            min={1}
                            max={100}
                          />
                        )}
                      />
                    </Box>
                    <Box>
                      <FormHelperText id="waf-policy-outbound-anomaly-score-threshold-desc">
                        {t('router.gateway.wafPolicy.outboundAnomalyScoreThresholdDesc')}
                      </FormHelperText>
                      <Controller
                        name="wafPolicy.outboundAnomalyScoreThreshold"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <LimitRateSlider
                            disabled={!hasPermission}
                            onChange={(_, newValue) => onChange(newValue)}
                            defaultValue={value}
                            valueLabelDisplay="auto"
                            step={1}
                            min={1}
                            max={100}
                          />
                        )}
                      />
                    </Box>
                    <Box>
                      <FormHelperText id="waf-policy-log-level-desc">
                        {t('router.gateway.wafPolicy.logLevelDesc')}
                      </FormHelperText>
                      <Controller
                        name="wafPolicy.logLevel"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <LimitRateSlider
                            disabled={!hasPermission}
                            onChange={(_, newValue) => onChange(newValue)}
                            defaultValue={value}
                            valueLabelDisplay="auto"
                            step={1}
                            min={0}
                            max={9}
                          />
                        )}
                      />
                    </Box>
                  </>
                )}
              </Stack>
            </Stack>
            <div className="form-actions">
              {hasPermission && (
                <Button
                  disabled={loading}
                  onClick={handleSubmit(onSubmit)}
                  color="primary"
                  variant="contained"
                  data-cy="submit-btn"
                  className="form-submit">
                  {t('common.save')} {loading && <Spinner size={16} />}
                </Button>
              )}
            </div>
          </Form>
        )}
      </Permission>
    </Div>
  );
}

const Div = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  max-width: 960px;

  .gateway-section {
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    padding: 24px 0;
    .gateway-section-title {
      width: 240px;
      flex-shrink: 0;
      flex-grow: 0;
      font-weight: 500;
    }
    .gateway-section-content {
      flex-grow: 1;
    }
  }
`;
