import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BlockletEvents } from '@blocklet/constant';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import Debug from 'debug';

import getWsClient from '../../libs/ws';

const debug = Debug('@abtnode/webapp:launch-blocklet:download-progress');

function useDownloadBundleProgresses({ appDid }) {
  const [progresses, setProgresses] = useState([]);

  const webSocketClient = getWsClient();

  useEffect(() => {
    webSocketClient.on(BlockletEvents.downloadBundleProgress, data => {
      if (appDid && appDid === data?.appDid) {
        setProgresses(pre => {
          const after = [...pre];
          const index = after.findIndex(x => x.component?.did === data.component?.did);
          if (data.status === 'completed') {
            if (index !== -1) {
              after.splice(index, 1);
            }
          } else if (index !== -1) {
            after[index] = data;
          } else {
            after.push(data);
          }
          return [...after];
        });
      }
    });

    return () => {
      webSocketClient.off(BlockletEvents.downloadBundleProgress);
    };
  }, [appDid, webSocketClient]);

  return progresses;
}

const getDownloadBundleStep = (progresses, t) => {
  debug('getDownloadBundleStep', progresses); // eslint-disable-line
  const lines = (progresses || []).map(progress => {
    const title = t(
      `launchBlocklet.waiting.${progress.status === 'extracting' ? 'extractingComponent' : 'downloadingComponent'}`,
      { name: progress.component?.title || '' }
    );

    const percent =
      progress.total && progress.current ? `: ${Math.floor((progress.current / progress.total) * 100)} %` : '';

    let name = progress.name ? `: ${progress.name}` : '';
    if (!percent) {
      name += '...';
    }

    return `${title}${percent}${name}`;
  });

  return lines.join('\n');
};

export default function DownloadBundleProgress({ appDid = '', visible = true }) {
  const { t } = useLocaleContext();
  const downloadBundleProgresses = useDownloadBundleProgresses({ appDid });

  return (
    <Container style={{ display: visible ? 'block' : 'none' }}>
      {getDownloadBundleStep(downloadBundleProgresses, t)}
    </Container>
  );
}

DownloadBundleProgress.propTypes = {
  appDid: PropTypes.string,
  visible: PropTypes.bool,
};

const Container = styled(Box)`
  flex: 0 0 auto;
  white-space: pre;
  overflow-y: auto;
  overflow-x: auto;
  max-height: 10em;
  max-width: 500px;
  min-width: auto;
  color: ${props => props.theme.palette.primary.main};
  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    max-width: 90%;
    max-height: 30vh;
  }
`;
