/* eslint-disable react/jsx-wrap-multilines */
import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { styled, useTheme, Typography, Box, Checkbox, FormControlLabel } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Logo from '@arcblock/ux/lib/Logo';
import ConnectLogo from '@arcblock/icons/lib/ConnectLogo';

import EulaContent from '@arcblock/license/lib/server';

export default function AgreeEula({ onGoToNext }) {
  const theme = useTheme();
  const [checked, setChecked] = useState(false);
  const { t } = useContext(LocaleContext);

  const handleChange = () => {
    setChecked(x => !x);
  };

  return (
    <Div>
      <Box>
        <Box
          sx={{
            textAlign: 'center',
          }}>
          <Logo
            mode={theme.palette.mode === 'dark' ? 'light' : 'dark'}
            showText={false}
            style={{ width: '60px', height: '60px', transform: 'scale(1)' }}
          />
        </Box>
        <Typography component="h2" variant="h3" className="title">
          {t('setup.title')}
        </Typography>

        <Typography component="h2" variant="h5" className="sub-title">
          {t('setup.steps.eula')}
        </Typography>
      </Box>
      <EulaContent className="eula-content" style={{ background: theme.palette.background.default }} />
      <div className="footer">
        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={handleChange}
              color="primary"
              checkedIcon={<CheckCircleRoundedIcon />}
              icon={<CheckCircleOutlineRoundedIcon />}
            />
          }
          label={t('setup.steps.eulaFooter')}
        />
        <Button disabled={!checked} variant="contained" color="primary" className="button" onClick={onGoToNext}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}>
            {t('common.continueWith')} <ConnectLogo className="logo" />
          </Box>
        </Button>
      </div>
    </Div>
  );
}

AgreeEula.propTypes = {
  onGoToNext: PropTypes.func.isRequired,
};

const Div = styled(Box)`
  width: 64%;
  max-width: 1920px;
  height: 100%;
  box-sizing: border-box;
  padding-top: 5%;
  padding-bottom: 5%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .title {
    margin-top: 24px;
    font-weight: 400;
    font-size: 24px;
    line-height: 28px;
    text-align: center;
    color: ${({ theme }) => theme.palette.text.primary};
  }
  .sub-title {
    margin-top: 16px;
    font-weight: 400;
    font-size: 18px;
    line-height: 21px;
    text-align: center;
    color: ${({ theme }) => theme.palette.grey[600]};
  }

  .footer {
    margin-top: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    .MuiFormControlLabel-root {
      .MuiSvgIcon-root {
      }
      .MuiFormControlLabel-label {
        position: relative;
        margin-left: 2px;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
        color: ${({ theme }) => theme.palette.grey[600]};
      }
    }
    .button {
      padding-left: 24px;
      padding-right: 24px;
      height: 56px;
      font-size: 18px;
      .logo {
        position: relative;
        margin-left: 8px;
        bottom: 1px;
        width: auto;
        height: 1.2em;
      }
      transition: opacity 0.4s;
    }
  }

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    width: 100%;
    padding: 8vw 4vw;
    .footer {
      flex-direction: column;
      align-items: unset;
      justify-content: unset;
      .MuiButton-root {
        margin-top: 15px;
        font-size: 18px;
      }
    }
  }
`;
