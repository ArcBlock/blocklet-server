import { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { joinURL } from 'ufo';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import DidAddress from '@abtnode/ux/lib/did-address';
import Spinner from '@mui/material/CircularProgress';

import PageHeader from '@blocklet/launcher-layout/lib/page-header';

import { useBlockletContext } from '../../contexts/blocklet';
import { useSessionContext } from '../../contexts/session';
import Layout from './layout';
import StepActions from './step-actions';
import Button from './button';

export default function Fuel({ onNext = () => {}, onPrevious = () => {} }) {
  const { locale, t } = useContext(LocaleContext);
  const { blocklet, gas, tokenInfo, actions } = useBlockletContext();
  const { api } = useSessionContext();
  const [open, setOpen] = useState(false);
  const { need = '', current = '', owe = 99999, deficiency, symbol = '', endpoint } = gas || {};
  const { origin: explorer = '/' } = endpoint ? new URL(endpoint) : {};

  useEffect(() => {
    const timer = setInterval(() => {
      actions.refreshFuel();
    }, 2000);

    return () => {
      clearInterval(timer);
    };
  }, []); // eslint-disable-line

  const onSuccess = () => {
    setOpen(false);
  };

  if (!gas) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Container>
      <div className="header">
        <PageHeader title={t('setup.fuel.title')} onClickBack={onPrevious} />
      </div>
      <Box className="qr-body">
        <Box
          className="tip"
          sx={{
            mb: 6,
          }}>
          {t('setup.fuel.tipStart').replace('slot', '')}
          <span className="amount">{`${need} ${symbol}`}</span>
          {t('setup.fuel.tipEnd')}
        </Box>
        <Box
          sx={{
            fontSize: 16,
            fontWeight: 'fontWeightBold',
            mb: 0.5,
          }}>
          {t('setup.fuel.addressTitle')}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
          <DidAddress className="address" did={blocklet.appDid} />
          <Link
            style={{ lineHeight: 1 }}
            target="_blank"
            href={joinURL(explorer, '/explorer/accounts/', blocklet.appDid)}
            underline="hover">
            <LaunchIcon className="icon-launch" />
          </Link>
        </Box>
        <Box
          sx={{
            my: 2,
          }}>
          <Button color="primary" onClick={() => setOpen(true)} disabled={!owe}>
            {t('setup.fuel.fuelApp')}
          </Button>
        </Box>
        <DidConnect
          popup
          open={open}
          action="fuel"
          checkFn={api.get}
          checkTimeout={10 * 60 * 1000}
          onSuccess={onSuccess}
          onClose={() => setOpen(false)}
          locale={locale}
          messages={{
            title: t('setup.connect.title'),
            scan: t('setup.connect.scan'),
            confirm: t('setup.connect.confirm'),
            success: t('setup.connect.success'),
          }}
          extraParams={{ amount: deficiency, ...tokenInfo, endpoint }}
        />

        <Box
          sx={{
            display: 'flex',
            color: 'text.secondary',
          }}>
          <Box
            sx={{
              display: 'flex',
            }}>
            <Box>{t('setup.fuel.need')}:</Box>
            <Box
              sx={{
                ml: 0.5,
                color: 'primary.main',
                fontWeight: 'fontWeightBold',
              }}>
              {need}
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              ml: 3,
            }}>
            <Box>{t('setup.fuel.current')}:</Box>
            <Box
              sx={{
                ml: 0.5,
                color: owe > 0 ? 'error.main' : 'primary.main',
                fontWeight: 'fontWeightBold',
              }}>
              {current}
            </Box>
          </Box>
        </Box>
      </Box>
      <StepActions mt={8}>
        <Button disabled={owe > 0} onClick={() => onNext()}>
          {t('setup.next')}
        </Button>
      </StepActions>
    </Container>
  );
}

Fuel.propTypes = {
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
};

const Container = styled(Layout)`
  .qr-body {
    width: 580px;
    ${(props) => props.theme.breakpoints.down('md')} {
      width: 80%;
    }
    display: flex;
    flex-direction: column;
    align-items: center;

    .tip {
      font-size: 16px;
      font-weight: bold;
    }

    .address {
      width: 100%;
      text-align: center;
    }

    .amount {
      color: ${(props) => props.theme.palette.primary.main};
    }

    .icon-launch {
      font-size: 16px;
      margin-left: 6px;
      line-height: 1;
      color: ${(props) => props.theme.palette.primary.main};
    }
  }
`;
