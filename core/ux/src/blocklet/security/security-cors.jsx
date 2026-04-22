/* eslint-disable react/require-default-props */
import { Box, Checkbox, FormControl, FormControlLabel, FormGroup, Switch, TextField, Tooltip } from '@mui/material';
import { Fragment } from 'react';
import { Icon } from '@iconify/react';
import iconHelpOutlineRounded from '@iconify-icons/material-symbols/help-outline-rounded';
import PropTypes from 'prop-types';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import { useMount } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function BlockletSecurityCORS({ config = {}, onChange = () => {}, disabled = false }) {
  const methodList = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
  const mergedConfig = {
    origin: {
      override: false,
      value: '*',
      smart: true,
    },
    methods: {
      override: false,
      value: [...methodList],
    },
    allowedHeaders: {
      override: false,
      value: '*',
    },
    exposedHeaders: {
      override: false,
      value: '*',
    },
    maxAge: {
      override: false,
      value: undefined,
    },
    optionsSuccessStatus: {
      override: false,
      value: 204,
    },
    preflightContinue: {
      override: false,
      value: false,
    },
    credentials: {
      override: false,
      value: false,
    },
    ...omitBy(config, isUndefined),
  };

  const { t } = useLocaleContext();

  const onPatchChange = (key, { override, value, smart }) => {
    const configItem = { ...mergedConfig?.[key] };

    if (!isUndefined(smart) && key === 'origin') {
      configItem.smart = smart;
    }
    if (!isUndefined(override)) {
      configItem.override = override;
    }
    if (!isUndefined(value)) {
      configItem.value = value;
    }
    onChange({
      ...mergedConfig,
      [key]: configItem,
    });
  };

  const configList = [
    {
      title: t('responseHeaderPolicy.form.cors.origin'),
      override: mergedConfig.origin.override,
      smart: mergedConfig.origin.smart,
      name: 'origin',
      required: true,
      value: mergedConfig.origin.value,
      content: (
        <FormControl
          fullWidth
          sx={{
            mt: 0.75,
            '& .MuiFormHelperText-root': {
              mx: 0,
            },
          }}>
          <TextField
            multiline
            minRows={4}
            maxRows={10}
            disabled={disabled}
            variant="outlined"
            size="small"
            placeholder={t('responseHeaderPolicy.form.cors.originPlaceholder')}
            helperText={t('responseHeaderPolicy.form.cors.originHelperText')}
            value={mergedConfig.origin.value}
            onChange={(e) => {
              onPatchChange('origin', {
                value: e.target.value,
              });
            }}
          />
        </FormControl>
      ),
    },
    {
      title: t('responseHeaderPolicy.form.cors.methods'),
      name: 'methods',
      override: mergedConfig.methods.override,
      required: true,
      value: mergedConfig.methods.value,
      content: (
        <FormGroup sx={{ flexDirection: 'row' }}>
          {methodList.map((method) => (
            <FormControlLabel
              key={method}
              control={
                <Checkbox
                  size="small"
                  disabled={disabled}
                  checked={mergedConfig.methods.value.includes(method)}
                  onChange={(e, value) => {
                    onPatchChange('methods', {
                      value: value
                        ? [...mergedConfig.methods.value, method]
                        : mergedConfig.methods.value.filter((x) => x !== method),
                    });
                  }}
                />
              }
              label={method}
            />
          ))}
        </FormGroup>
      ),
    },
    {
      title: t('responseHeaderPolicy.form.cors.allowedHeaders'),
      override: mergedConfig.allowedHeaders.override,
      name: 'allowedHeaders',
      value: mergedConfig.allowedHeaders.value,
      content: (
        <FormControl
          fullWidth
          sx={{
            mt: 0.75,
            '& .MuiFormHelperText-root': {
              mx: 0,
            },
          }}>
          <TextField
            multiline
            minRows={3}
            maxRows={7}
            disabled={disabled}
            variant="outlined"
            size="small"
            placeholder={t('responseHeaderPolicy.form.cors.allowedHeadersPlaceholder')}
            helperText={t('responseHeaderPolicy.form.cors.allowedHeadersHelperText')}
            value={mergedConfig.allowedHeaders.value}
            onChange={(e) => {
              onPatchChange('allowedHeaders', {
                value: e.target.value,
              });
            }}
          />
        </FormControl>
      ),
    },
    {
      title: t('responseHeaderPolicy.form.cors.exposedHeaders'),
      override: mergedConfig.exposedHeaders.override,
      name: 'exposedHeaders',
      value: mergedConfig.exposedHeaders.value,
      content: (
        <FormControl
          fullWidth
          sx={{
            mt: 0.75,
            '& .MuiFormHelperText-root': {
              mx: 0,
            },
          }}>
          <TextField
            multiline
            minRows={3}
            maxRows={7}
            disabled={disabled}
            variant="outlined"
            size="small"
            placeholder={t('responseHeaderPolicy.form.cors.exposedHeadersPlaceholder')}
            helperText={t('responseHeaderPolicy.form.cors.exposedHeadersHelperText')}
            value={mergedConfig.exposedHeaders.value}
            onChange={(e) => {
              onPatchChange('exposedHeaders', {
                value: e.target.value,
              });
            }}
          />
        </FormControl>
      ),
    },
    {
      title: t('responseHeaderPolicy.form.cors.maxAge'),
      override: mergedConfig.maxAge.override,
      name: 'maxAge',
      value: mergedConfig.maxAge.value,
      content: (
        <FormControl
          fullWidth
          sx={{
            mt: 0.75,
            '& .MuiFormHelperText-root': {
              mx: 0,
            },
          }}>
          <TextField
            type="number"
            variant="outlined"
            size="small"
            disabled={disabled}
            value={mergedConfig.maxAge.value}
            onChange={(e) => {
              onPatchChange('maxAge', {
                value: e.target.value,
              });
            }}
            helperText={t('responseHeaderPolicy.form.cors.maxAgeHelperText')}
          />
        </FormControl>
      ),
    },
    {
      title: t('responseHeaderPolicy.form.cors.optionsSuccessStatus'),
      override: mergedConfig.optionsSuccessStatus.override,
      name: 'optionsSuccessStatus',
      value: mergedConfig.optionsSuccessStatus.value,
      content: (
        <FormControl
          fullWidth
          sx={{
            mt: 0.75,
            '& .MuiFormHelperText-root': {
              mx: 0,
            },
          }}>
          <TextField
            type="number"
            variant="outlined"
            size="small"
            disabled={disabled}
            value={mergedConfig.optionsSuccessStatus.value}
            onChange={(e) => {
              onPatchChange('optionsSuccessStatus', {
                value: e.target.value,
              });
            }}
          />
        </FormControl>
      ),
    },
    {
      title: t('responseHeaderPolicy.form.cors.preflightContinue'),
      override: mergedConfig.preflightContinue.override,
      name: 'preflightContinue',
      value: mergedConfig.preflightContinue.value,
      control: (
        <Switch
          size="small"
          disabled={disabled}
          checked={mergedConfig.preflightContinue.value}
          onChange={(e, value) => {
            onPatchChange('preflightContinue', { value });
          }}
        />
      ),
    },
    {
      title: t('responseHeaderPolicy.form.cors.credentials'),
      override: mergedConfig.credentials.override,
      name: 'credentials',
      value: mergedConfig.credentials.value,
      control: (
        <Switch
          size="small"
          disabled={disabled}
          checked={mergedConfig.credentials.value}
          onChange={(e, value) => {
            onPatchChange('credentials', { value });
          }}
        />
      ),
    },
  ];

  useMount(() => {
    // NOTICE: 首次加载时，将默认的数据写回
    onChange(mergedConfig);
  });

  const checkboxStyle = {
    '.PrivateSwitchBase-input+svg': {
      fontSize: '1rem',
    },
    '.MuiCheckbox-sizeSmall': {
      p: 0.75,
    },
    '.MuiFormControlLabel-label': {
      fontSize: '0.8rem',
    },
  };

  return (
    <FormGroup>
      {configList.map((item, index) => {
        return (
          <Fragment key={item.name}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <FormControlLabel
                key={`${item.name}_form`}
                sx={{ mt: index === 0 ? 0 : 1 }}
                control={item.control || <Box sx={{ pl: 1.35 }} />}
                label={item.title}
                required={item.required}
              />
              <Box>
                {item.name === 'origin' ? (
                  <FormControlLabel
                    key={`${item.name}_smart`}
                    control={
                      <Checkbox
                        size="small"
                        checked={item.smart}
                        color="primary"
                        disabled={disabled}
                        onChange={() => {
                          onPatchChange(item.name, {
                            smart: !item.smart,
                          });
                        }}
                      />
                    }
                    label={
                      <>
                        {t('responseHeaderPolicy.form.cors.smartMode')}
                        <Tooltip title={t('responseHeaderPolicy.form.cors.smartModeHelperText')}>
                          <Box
                            component={Icon}
                            icon={iconHelpOutlineRounded}
                            sx={{
                              cursor: 'pointer',
                              color: 'grey',
                              ml: 0.5,
                              fontSize: '1.1em',
                            }}
                          />
                        </Tooltip>
                      </>
                    }
                    sx={checkboxStyle}
                  />
                ) : null}
                <FormControlLabel
                  key={`${item.name}_override`}
                  control={
                    <Checkbox
                      size="small"
                      checked={item.override}
                      color="warning"
                      disabled={disabled}
                      onChange={() => {
                        onPatchChange(item.name, {
                          override: !item.override,
                        });
                      }}
                    />
                  }
                  label={
                    <>
                      {t('responseHeaderPolicy.form.originOverride')}
                      <Tooltip title={t('responseHeaderPolicy.form.originOverrideHelperText')}>
                        <Box
                          component={Icon}
                          icon={iconHelpOutlineRounded}
                          sx={{
                            cursor: 'pointer',
                            color: 'grey',
                            ml: 0.5,
                            fontSize: '1.1em',
                          }}
                        />
                      </Tooltip>
                    </>
                  }
                  sx={{
                    ...checkboxStyle,
                    mr: 0,
                  }}
                />
              </Box>
            </Box>
            {item.content ? (
              <Box
                key={`${item.name}_content`}
                sx={{
                  ml: 3.5,
                }}>
                {item.content}
              </Box>
            ) : null}
          </Fragment>
        );
      })}
    </FormGroup>
  );
}

BlockletSecurityCORS.propTypes = {
  config: PropTypes.object,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
