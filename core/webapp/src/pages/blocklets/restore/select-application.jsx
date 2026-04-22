import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import Spinner from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Typography from '@mui/material/Typography';

import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import DidAddress from '@abtnode/ux/lib/did-address';
import Avatar from '@arcblock/did-connect-react/lib/Avatar';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Empty from '@arcblock/ux/lib/Empty';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';
import { formatToDatetime } from '@abtnode/ux/lib/util';

import { useNodeContext } from '../../../contexts/node';

export default function SelectBlocklet({ onSelect = () => {} }) {
  const { api } = useNodeContext();
  const { t, locale } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [appDid, setAppDid] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getBackups = async () => {
    try {
      setLoading(true);
      setError(false);

      const {
        getBlocklets: { blocklets },
        getBlockletsFromBackup: { backups: data },
      } = await api.doBatchQuery({
        getBlocklets: { input: {} },
        getBlockletsFromBackup: { input: {} },
      });

      setBackups(
        (data || [])
          .filter(x => !(blocklets || []).some(y => x.appPid === y.meta?.did))
          .sort((a, b) => b.createdAt - a.createdAt)
          // suppose we only need the latest 200 backups
          .slice(0, 200)
      );

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  useEffect(() => {
    getBackups();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onStartInstall = () => {
    const item = backups.find(x => x.appDid === appDid);
    onSelect({ did: item.appDid, name: item.appDid, title: item.name });
    const url = new URL(window.location.href);
    url.searchParams.set('appDid', item.appDid);
    url.searchParams.set('appName', item.name);
    navigate(`/blocklets/restore/verify-ownership${url.search}`);
  };

  const handleChange = backup => {
    setAppDid(backup.appDid);
  };

  let listContent = null;
  if (error) {
    listContent = (
      <Alert severity="error" style={{ width: '100%', marginTop: 8 }}>
        {error}
      </Alert>
    );
  } else if (loading) {
    listContent = <Spinner size={16} />;
  } else if (!backups.length) {
    listContent = <Empty>{t('common.empty')}</Empty>;
  } else {
    listContent = (
      <BoxContainer>
        {backups.map(backup => (
          <BackupItemContainer
            className={`middle-font-size space ${appDid === backup.appDid ? 'selected' : ''}`}
            key={backup.appDid}
            onClick={() => handleChange(backup)}>
            <div className="left">
              <div className="header">
                <Box sx={{ width: 40, height: 40 }}>
                  <Avatar did={backup.appDid} size={40} />
                </Box>
              </div>
              <div className="body">
                <Typography
                  className="text"
                  sx={{
                    color: 'text.secondary',
                  }}>
                  {backup.name}
                </Typography>
                <Typography
                  className="text middle-font-size"
                  sx={{
                    color: 'text.secondary',
                  }}>
                  <DidAddress responsive={false} compact inline copyable={false} size={12} did={backup.appDid} />
                </Typography>
              </div>
              <Box
                className="footer small-font-size"
                sx={{
                  color: 'text.secondary',
                }}>
                {t('blocklet.restoreFromServer.backupIn')} {formatToDatetime(backup.createdAt, locale)}
              </Box>
            </div>
            <div className="right">
              <div className="more">
                <IconButton onClick={() => undefined} className="more-btn" size="large" aria-label="more functions">
                  <MoreVertIcon color="disabled" />
                </IconButton>
              </div>
            </div>
            <div className="selected-container">
              <CheckIcon className="selected-icon" />
            </div>
          </BackupItemContainer>
        ))}
      </BoxContainer>
    );
  }

  return (
    <Main style={{ width: '100%' }}>
      <PageHeader
        title={t('blocklet.restoreFromServer.selectTitle')}
        subTitle={t('blocklet.restoreFromServer.description')}
      />
      <Box
        className="main-body"
        sx={{
          mt: 4,
          mx: 3,
        }}>
        {listContent}
      </Box>
      <Box
        className="main-footer"
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}>
        <Button
          sx={{
            width: '180px',
            height: '100%',
          }}
          onClick={e => {
            e.stopPropagation();
            onStartInstall();
          }}
          color="primary"
          data-cy="install-blocklet-next-step"
          variant="contained"
          disabled={loading || error || !appDid}>
          {t('common.restore')}
        </Button>
      </Box>
    </Main>
  );
}

SelectBlocklet.propTypes = {
  onSelect: PropTypes.func,
};

const Main = styled(Box)`
  .main-body {
    height: 50vh;
    ${props => props.theme.breakpoints.down('md')} {
      height: 80vh;
    }

    overflow: auto;
  }
  .main-footer {
    padding-top: 24px;
    padding-bottom: 24px;
    ${props => props.theme.breakpoints.down('md')} {
      position: fixed;
      bottom: 16px;
      width: 100%;
      padding-bottom: 0;
    }
  }
`;

const BoxContainer = styled(Box)`
  display: block;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto;

  .space {
    display: flex;
    margin: 8px auto;

    .selected-container {
      position: absolute;
      right: 0px;
      bottom: 0px;
      display: flex;
      -webkit-box-pack: end;
      justify-content: flex-end;
      align-items: flex-end;
      width: 30px;
      height: 30px;
      border-radius: 0px 0px 7px;
      color: rgb(255, 255, 255);
      overflow: hidden;
      transition: all 0.3s ease 0s;

      &::after {
        position: absolute;
        z-index: 0;
        left: 30px;
        top: 30px;
        display: block;
        width: 0px;
        height: 0px;
        border-width: 15px;
        border-style: solid;
        /* border-color: transparent rgb(29, 193, 199) rgb(29, 193, 199) transparent; */
        border-color: transparent ${props => props.theme.palette.primary.main}
          ${props => props.theme.palette.primary.main} transparent;
        transition: all 0.1s ease 0s;
        content: '';
      }

      .selected-icon {
        visibility: hidden;
        width: 60%;
        height: 60%;
        position: relative;
        z-index: 2;
        margin: 0px 1px 1px 0px;
        font-size: 16px;
        transition: all 0.2s ease 0s;
      }
    }
  }

  .space.selected {
    background-color: ${({ theme }) => alpha(theme.palette.primary.light, 0.12)};
    border-color: ${({ theme }) => alpha(theme.palette.primary.light, 0.12)};

    .selected-container {
      &::after {
        left: 0px;
        top: 0px;
      }

      .selected-icon {
        visibility: visible;
      }
    }
  }
`;

const BackupItemContainer = styled(Box)`
  display: flex;
  position: relative;
  width: 100%;
  padding: 10px;
  border: 1 solid;
  border-color: ${({ theme }) => theme.palette.divider};
  cursor: pointer;

  .left {
    display: flex;
    align-items: flex-start;
    width: 100%;
    margin: 0px 20px 0px 0px;

    .header {
      padding: 5px 16px 0 0;
    }

    .body {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .footer {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      height: 100%;
    }
  }

  .right {
    display: flex;
  }

  ${props => props.theme.breakpoints.down('md')} {
    .left {
      display: flex;
      flex-direction: column;
      margin-right: 20px;

      .header {
        display: none;
      }

      .footer {
        margin-top: 6px;
        margin-left: 0px;
        padding: 2px 0px;
        height: auto;
      }
    }

    .right {
      width: auto;
    }

    .text {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
    }
  }

  // 公共属性
  .middle-font-size {
    font-size: 14px;
  }

  .small-font-size {
    font-size: 12px;
  }
`;
