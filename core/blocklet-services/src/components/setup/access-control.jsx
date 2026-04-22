/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { Radio, RadioGroup, FormControlLabel, FormControl, Box, useTheme } from '@mui/material';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import AccessConfig from '@abtnode/ux/lib/who-can-access/config';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import {
  ACCESS_POLICY_ADMIN_ONLY,
  ACCESS_POLICY_INVITED_ONLY,
  ACCESS_POLICY_OWNER_ONLY,
  ACCESS_POLICY_PUBLIC,
  NODE_SERVICES,
  SECURITY_RULE_DEFAULT_ID,
  WHO_CAN_ACCESS,
} from '@abtnode/constant';
import { findServiceFromMeta } from '@blocklet/meta/lib/util';

import { useBlockletContext } from '../../contexts/blocklet';
import Layout from './layout';
import StepActions from './step-actions';
import Button from './button';
import client from '../../libs/client';

export default function AccessControl({ onNext = () => {} }) {
  const theme = useTheme();
  const { t, locale } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');
  const { blocklet } = useBlockletContext();

  useEffect(() => {
    // 获取 blocklet.yml 中的默认配置
    const service = findServiceFromMeta(blocklet.meta, NODE_SERVICES.AUTH);
    setValue(service?.config?.whoCanAccess || WHO_CAN_ACCESS.ALL);
  }, [blocklet]);

  const submit = async (whoCanAccess) => {
    let accessPolicyId = ACCESS_POLICY_PUBLIC;
    if (whoCanAccess === WHO_CAN_ACCESS.ALL) {
      accessPolicyId = ACCESS_POLICY_PUBLIC;
    } else if (whoCanAccess === WHO_CAN_ACCESS.INVITED) {
      accessPolicyId = ACCESS_POLICY_INVITED_ONLY;
    } else if (whoCanAccess === WHO_CAN_ACCESS.OWNER) {
      accessPolicyId = ACCESS_POLICY_OWNER_ONLY;
    } else if (whoCanAccess === WHO_CAN_ACCESS.ADMIN) {
      accessPolicyId = ACCESS_POLICY_ADMIN_ONLY;
    }
    try {
      setLoading(true);
      await client.updateBlockletSecurityRule({
        input: {
          did: blocklet.meta.did,
          data: {
            id: SECURITY_RULE_DEFAULT_ID,
            accessPolicyId,
          },
        },
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Toast.error(err.message);
    }
  };

  const handleChange = async (event) => {
    if (loading) {
      return;
    }
    setValue(event.target.value);
    await submit(event.target.value);
  };

  const iconStyle = {
    marginRight: 4,
    fontSize: 18,
    verticalAlign: 'text-bottom',
    color: theme.palette.text.secondary,
  };

  return (
    <Container>
      <Box className="header">
        <PageHeader title={t('blocklet.config.access.title')} subTitle={t('blocklet.config.access.description')} />
      </Box>

      <Box className="form-container">
        <FormControl component="fieldset">
          <RadioGroup name="inherit" value={value} onChange={handleChange}>
            {AccessConfig.map((rule) => {
              return (
                <Box key={rule.value} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                  <FormControlLabel
                    value={rule.value}
                    control={<Radio size="small" color="primary" />}
                    label={
                      <span style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <rule.icon style={iconStyle} />
                        <span style={{ marginTop: 2 }}>{rule.title[locale]}</span>
                      </span>
                    }
                  />
                  <Box className="tip">{rule.description[locale]}</Box>
                </Box>
              );
            })}
          </RadioGroup>
        </FormControl>
      </Box>
      <StepActions mt={8} disabled={loading} blocklet={blocklet} onStartNow={() => onNext('complete')}>
        <Button loading={loading} variant="contained" disabled={loading} onClick={() => onNext()}>
          {t('setup.continue')}
        </Button>
      </StepActions>
    </Container>
  );
}

AccessControl.propTypes = {
  onNext: PropTypes.func,
};

const Container = styled(Layout)`
  height: 100%;
  overflow-y: auto;
  .header {
    width: 100%;
    margin-top: 60px;
  }
  .tip {
    margin-left: 30px;
    font-size: 12px;
    margin-top: -8px;
    color: ${(props) => props.theme.palette.text.disabled};
  }
`;
