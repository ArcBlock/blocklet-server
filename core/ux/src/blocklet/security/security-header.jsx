/* eslint-disable react/require-default-props */
import { Box, Checkbox, FormControlLabel, FormGroup, Switch, Tooltip } from '@mui/material';
import { useMount } from 'ahooks';
import PropTypes from 'prop-types';
import { Fragment } from 'react';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import { Icon } from '@iconify/react';
import iconHelpOutlineRounded from '@iconify-icons/material-symbols/help-outline-rounded';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import ConfigXFrameOptions from './header-config/config-x-frame-options';
import ConfigReferrerPolicy from './header-config/config-referrer-policy';
import ConfigContentSecurityPolicy from './header-config/config-content-security-policy';

export default function BlockletSecurityHeader({ config = {}, onChange = () => {}, disabled = false }) {
  const mergedConfig = {
    contentSecurityPolicy: {
      override: false,
      value: false,
    },
    referrerPolicy: {
      override: false,
      value: false,
    },
    xFrameOptions: {
      override: false,
      value: false,
    },
    xPoweredBy: {
      override: false,
      value: true,
    },
    xXssProtection: {
      override: false,
      value: false,
    },
    ...omitBy(config, isUndefined),
  };
  const { t } = useLocaleContext();

  const onPatchChange = (key, { override, value }) => {
    const configItem = { ...mergedConfig?.[key] };

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
  const headerList = [
    {
      title: 'Content-Security-Policy',
      name: 'contentSecurityPolicy',
      override: mergedConfig.contentSecurityPolicy.override,
      value: Boolean(mergedConfig.contentSecurityPolicy.value),
      content: (
        <ConfigContentSecurityPolicy
          disabled={disabled}
          value={mergedConfig.contentSecurityPolicy.value}
          onChange={(value) => {
            onPatchChange('contentSecurityPolicy', { value });
          }}
        />
      ),
      onChange(value) {
        onPatchChange('contentSecurityPolicy', { value });
      },
    },
    {
      title: 'Referrer-Policy',
      name: 'referrerPolicy',
      override: mergedConfig.referrerPolicy.override,
      value: Boolean(mergedConfig.referrerPolicy.value),
      content: (
        <ConfigReferrerPolicy
          disabled={disabled}
          value={mergedConfig.referrerPolicy.value}
          onChange={(value) => {
            onPatchChange('referrerPolicy', { value });
          }}
        />
      ),
      onChange(value) {
        onPatchChange('referrerPolicy', { value });
      },
    },
    // {
    //   title: 'Strict-Transport-Security',
    //   name: 'strictTransportSecurity',
    //   value: false,
    // },
    // {
    //   title: 'X-Content-Type-Options',
    //   name: 'xContentTypeOptions',
    //   value: false,
    // },
    {
      title: 'X-Frame-Options',
      name: 'xFrameOptions',
      override: mergedConfig.xFrameOptions.override,
      value: Boolean(mergedConfig.xFrameOptions.value),
      content: (
        <ConfigXFrameOptions
          disabled={disabled}
          value={mergedConfig.xFrameOptions.value}
          onChange={(value) => {
            onPatchChange('xFrameOptions', { value });
          }}
        />
      ),
      onChange(value) {
        onPatchChange('xFrameOptions', { value });
      },
    },
    {
      title: 'Disable X-Powered-By',
      name: 'xPoweredBy',
      override: mergedConfig.xPoweredBy.override,
      value: mergedConfig.xPoweredBy.value,
      content: null,
      onChange(value) {
        onPatchChange('xPoweredBy', { value });
      },
    },
    {
      title: 'X-XSS-Protection',
      name: 'xXssProtection',
      override: mergedConfig.xXssProtection.override,
      value: mergedConfig.xXssProtection.value,
      content: null,
      onChange(value) {
        onPatchChange('xXssProtection', { value });
      },
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
      {headerList.map((item, index) => {
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
                control={
                  <Switch
                    key={`${item.name}_switch`}
                    size="small"
                    disabled={disabled}
                    checked={item.value}
                    onChange={() => {
                      item.onChange(!item.value);
                    }}
                  />
                }
                label={item.title}
              />
              {item.value ? (
                <FormControlLabel
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
                  sx={{ ...checkboxStyle, mr: 0 }}
                />
              ) : null}
            </Box>
            {item.value && item.content ? (
              <Box key={`${item.name}_content`} sx={{ ml: 3.7 }}>
                {item.content}
              </Box>
            ) : null}
          </Fragment>
        );
      })}
    </FormGroup>
  );
}

BlockletSecurityHeader.propTypes = {
  config: PropTypes.object,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
