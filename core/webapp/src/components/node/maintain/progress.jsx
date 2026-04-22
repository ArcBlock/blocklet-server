/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import useInterval from 'react-use/lib/useInterval';

import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Spinner from '@mui/material/CircularProgress';
import IconPending from '@mui/icons-material/Schedule';
import IconDone from '@mui/icons-material/Check';
import IconError from '@mui/icons-material/Close';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { EVENTS } from '@abtnode/constant';

import { useNodeContext } from '../../../contexts/node';
import { useSubscription } from '../../../libs/ws';

const stagesMaps = {
  upgrade: {
    normal: ['setup', 'installing', 'verifying', 'restarting', 'cleanup', 'complete'],
    error: ['setup', 'installing', 'verifying', 'rollback', 'complete'],
  },
  restart: {
    normal: ['setup', 'verifying', 'restarting', 'cleanup', 'complete'],
    error: ['setup', 'verifying', 'rollback', 'complete'],
  },
};

export default function MaintainProgress() {
  const { t } = useLocaleContext();
  const { api, info } = useNodeContext();
  const [stage, setStage] = useState('setup');
  const [action, setAction] = useState('upgrade');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pooling, setPooling] = useState(false);

  const map = stagesMaps[action];
  const stages = stage === 'rollback' || history.find(s => s.stage === 'rollback') ? map.error : map.normal;

  useEffect(() => {
    api
      .getSession({ input: { id: info.upgradeSessionId } })
      .then(({ session }) => {
        if (session && stages.includes(session.stage)) {
          setStage(session.stage);
          setAction(session.action);
          setHistory(session.history);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error loading ${action} session`, info.upgradeSessionId, err.message);
        setLoading(false);
      });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (stage === 'cleanup') {
      setPooling(true);
    } else if (stage === 'complete') {
      setTimeout(() => {
        window.location.reload();
      }, 8000);
    } else {
      setPooling(false);
    }
  }, [stage]);

  useInterval(
    () => {
      api
        .getSession({ input: { id: info.upgradeSessionId } })
        .then(({ session }) => {
          if (session && stages.includes(session.stage)) {
            setStage(session.stage);
            setHistory(session.history);
          }
        })
        .catch(err => {
          console.error(`Error loading ${action} session`, info.upgradeSessionId, err.message);
        });
    },
    pooling ? 1000 : null
  );

  useSubscription(EVENTS.NODE_MAINTAIN_PROGRESS, progress => {
    if (progress && stages.includes(progress.stage)) {
      if (stage === 'cleanup') {
        // delay 10s if next stage is cleanup, because restarting stage will immediately return before restarting complete
        setTimeout(() => {
          setStage(progress.stage);
          setHistory(progress.history);
        }, 10 * 1000);
      } else {
        setStage(progress.stage);
        setHistory(progress.history);
      }
    } else {
      console.error(`unknown ${action} stage`, progress);
    }
  });

  return (
    <Div>
      <div className="icons">
        <span className="icon icon-gear icon-spin right slow one" />
        <span className="icon icon-gear icon-spin left two" />
        <span className="icon icon-gear icon-spin left three" />
      </div>
      {loading && <Spinner size={32} style={{ marginTop: 32 }} />}
      {!loading && (
        <>
          <Typography variant="h2" color="textPrimary">
            {t(`setting.form.${action}.progress`, { name: info.name })}
          </Typography>
          <Typography component="p" color="textSecondary">
            {t(`setting.form.${action}.description`)}
          </Typography>
          <List className="stages">
            {stages.map((x, i) => {
              const currentIndex = stages.indexOf(stage);
              const isDone = currentIndex >= i && history.find(s => s.stage === x && s.succeed);
              const isError = currentIndex >= i && history.find(s => s.stage === x && !s.succeed);
              const isProgress = currentIndex === i;

              let className = '';
              if (isDone) {
                className = 'stage-done';
              } else if (isError) {
                className = 'stage-error';
              } else if (isProgress) {
                className = 'stage-progress';
              } else {
                className = 'stage-pending';
              }

              let icon = null;
              if (isDone) {
                icon = <IconDone />;
              } else if (isError) {
                icon = <IconError />;
              } else if (isProgress) {
                icon = <Spinner size={20} color="secondary" />;
              } else {
                icon = <IconPending />;
              }

              return (
                <ListItem className={`stage ${className}`} key={x}>
                  <ListItemIcon className="stage-icon">{icon}</ListItemIcon>
                  <ListItemText className="stage-text">
                    {t(`setting.form.${action}.${x}`, { version: info.nextVersion || info.version })}
                  </ListItemText>
                </ListItem>
              );
            })}
          </List>
        </>
      )}
    </Div>
  );
}

const Div = styled(Paper)`
  padding: 24px 16px;
  border-radius: 8px;
  min-height: 480px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  @font-face {
    font-family: 'icomoon';
    src: url('data:application/x-font-ttf;charset=utf-8;base64,AAEAAAALAIAAAwAwT1MvMg8SC/QAAAC8AAAAYGNtYXAQQ+CtAAABHAAAAFRnYXNwAAAAEAAAAXAAAAAIZ2x5ZtzYyQ0AAAF4AAABtGhlYWQOn7WzAAADLAAAADZoaGVhBzADxgAAA2QAAAAkaG10eAluAAAAAAOIAAAAFGxvY2EAKADuAAADnAAAAAxtYXhwAAgAhQAAA6gAAAAgbmFtZZlKCfsAAAPIAAABhnBvc3QAAwAAAAAFUAAAACAAAwK3AZAABQAAApkCzAAAAI8CmQLMAAAB6wAzAQkAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAABAAADwEwPA/8AAQAPAAEAAAAABAAAAAAAAAAAAAAAgAAAAAAADAAAAAwAAABwAAQADAAAAHAADAAEAAAAcAAQAOAAAAAoACAACAAIAAQAg8BP//f//AAAAAAAg8BP//f//AAH/4w/xAAMAAQAAAAAAAAAAAAAAAQAB//8ADwABAAAAAAAAAAAAAgAANzkBAAAAAAEAAAAAAAAAAAACAAA3OQEAAAAAAQAAAAAAAAAAAAIAADc5AQAAAAACAAAAAANuA24ADwCCAAABNCcmIyIHBhUUFxYzMjc2JRUUBwYPAQYHFhcWFRQHBgcGIyIvAQYHBgcGKwEiJyY1JyYnBwYjIicmJyY1NDc2NzY3Ji8BJicmPQE0NzY/ATY3JicmNTQ3Njc2MzIfATY3Njc2OwEyFxYfARYXNzYzMhcWFxYVFAcGBwYHFh8BFhcWFQJJKys8PSsqKis9PCsrASUFBAdqCwsUKQYGDykpDQcITxkbCQcEEX8IBgYQHBhQBggIB0gWBAUIFRQLEAhoCAQFBQQGawgOFyYGBQ8qKQ0HB08ZGwkIBBB/CAYGARAcF1EGCAgGShUEBQgVFQoPCWgIBAUBtzwrKysrPD0rKiore38HBgYBEB8VHTIHBwgGFSgpBT4NCU0dEAUFB2kJDD0FBkIeBggGBwwaGg4dHA8BBgYIfgcHBgEQGhsgLgcHBgcVKSkGPQ0ITh0QBQUHagkMPQYGRB0FCAcGDBoaDh0bEAEGBggAAQAAAAEAANRjIH1fDzz1AAsEAAAAAADWCbikAAAAANYJuKQAAAAAA24DbgAAAAgAAgAAAAAAAAABAAADwP/AAAAEAAAAAAADbgABAAAAAAAAAAAAAAAAAAAABQQAAAAAAAAAAAAAAAIAAAADbgAAAAAAAAAKABQAHgDaAAEAAAAFAIMAAgAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAOAK4AAQAAAAAAAQAHAAAAAQAAAAAAAgAHAGAAAQAAAAAAAwAHADYAAQAAAAAABAAHAHUAAQAAAAAABQALABUAAQAAAAAABgAHAEsAAQAAAAAACgAaAIoAAwABBAkAAQAOAAcAAwABBAkAAgAOAGcAAwABBAkAAwAOAD0AAwABBAkABAAOAHwAAwABBAkABQAWACAAAwABBAkABgAOAFIAAwABBAkACgA0AKRpY29tb29uAGkAYwBvAG0AbwBvAG5WZXJzaW9uIDEuMABWAGUAcgBzAGkAbwBuACAAMQAuADBpY29tb29uAGkAYwBvAG0AbwBvAG5pY29tb29uAGkAYwBvAG0AbwBvAG5SZWd1bGFyAFIAZQBnAHUAbABhAHJpY29tb29uAGkAYwBvAG0AbwBvAG5Gb250IGdlbmVyYXRlZCBieSBJY29Nb29uLgBGAG8AbgB0ACAAZwBlAG4AZQByAGEAdABlAGQAIABiAHkAIABJAGMAbwBNAG8AbwBuAC4AAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
      format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  .stages {
    .stage-done {
      .stage-icon,
      .stage-text {
        color: ${props => props.theme.palette.success.main};
      }
    }

    .stage-progress {
      .stage-icon,
      .stage-text {
        color: ${props => props.theme.palette.secondary.main};
      }
    }

    .stage-pending {
      .stage-icon,
      .stage-text {
        color: ${props => props.theme.palette.text.disabled};
      }
    }

    .stage-error {
      .stage-icon,
      .stage-text {
        color: ${props => props.theme.palette.error.main};
      }
    }
  }

  h2 {
    font-size: 28px;
    margin-top: 16px;
    margin-bottom: 16px;
    color: #009bdb;
  }

  p {
    text-align: center;
  }

  [class^='icon-'],
  [class*=' icon-'] {
    /* use !important to prevent issues with browser extensions that change fonts */
    font-family: 'icomoon' !important;
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;

    /* Better Font Rendering =========== */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .icon-cog:before {
    content: '\f013';
  }
  .icon-gear:before {
    content: '\f013';
  }

  .icon-spin {
    position: absolute;
  }

  .icons {
    position: relative;
    margin: 0 auto;
    width: 71px;
    height: 63px;
  }

  .one {
    top: 50%;
    margin-top: -27px;
    left: 0;
    font-size: 55px;
  }

  .two {
    font-size: 32px;
    right: 0;
    top: 0;
  }

  .three {
    font-size: 32px;
    right: 0;
    bottom: 0;
  }

  .icon {
    color: #009bdb;
  }

  .right {
    animation: spin 2s infinite linear;
  }

  .left {
    animation: spin-left 2s infinite linear;
  }

  .slow {
    animation-duration: 3s;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(359deg);
    }
  }
  @keyframes spin-left {
    0% {
      transform: rotate(359deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
`;
