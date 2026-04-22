/* eslint-disable react/jsx-one-expression-per-line */
import { useContext } from 'react';
import styled from '@emotion/styled';

import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import { filesize } from '../util';
import useBlockletWithDiskInfo from '../hooks/use-bocklet-with-disk-info';

export default function BlockletDiskInfo({ ...rest }) {
  const { t } = useContext(LocaleContext);
  // 此处应该使用自定义的 hook 来获取数据为最优解。一是 refreshBlocklet 在其他地方频繁调用不会影响这里的数据准确性，二是 disk info 数据的生命周期只在这个页面
  const { blocklet, loading } = useBlockletWithDiskInfo();

  if (blocklet?.diskInfo) {
    const renderDiskInfo = (dir, size, handler) => (
      <Typography>
        {handler ? (
          /* eslint-disable-next-line no-script-url, jsx-a11y/anchor-is-valid */
          <Link style={{ cursor: 'pointer' }} onClick={handler} underline="hover">
            {dir}
          </Link>
        ) : (
          dir
        )}{' '}
        <strong>{size ? filesize(size) : 'empty'}</strong>
      </Typography>
    );

    const env = blocklet.environments.reduce((acc, x) => {
      acc[x.key] = x.value;
      return acc;
    }, {});

    const rows = [
      {
        key: 'appDir',
        name: t('blocklet.diskInfo.appDir'),
        value: renderDiskInfo(env.BLOCKLET_APP_DIR, blocklet.diskInfo.app),
      },
      {
        key: 'dataDir',
        name: t('blocklet.diskInfo.dataDir'),
        value: renderDiskInfo(env.BLOCKLET_DATA_DIR, blocklet.diskInfo.data),
      },
      {
        key: 'logDir',
        name: t('blocklet.diskInfo.logDir'),
        value: renderDiskInfo(env.BLOCKLET_LOG_DIR, blocklet.diskInfo.log),
      },
      {
        key: 'cacheDir',
        name: t('blocklet.diskInfo.cacheDir'),
        value: renderDiskInfo(env.BLOCKLET_CACHE_DIR, blocklet.diskInfo.cache),
      },
    ];

    return (
      <Div component="div" {...rest}>
        {rows.map((row) => (
          <InfoRow valueComponent="div" key={row.key} nameWidth={120} name={row.name}>
            {row.value}
          </InfoRow>
        ))}
      </Div>
    );
  }

  if (loading) {
    return <CircularProgress />;
  }

  return <Typography>{t('blocklet.diskInfo.empty')}</Typography>;
}

const Div = styled(Typography)``;
