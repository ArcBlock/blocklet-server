import PropTypes from 'prop-types';

import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tooltip from '@mui/material/Tooltip';
import { Icon } from '@iconify/react';

import Line from './line';
import { StyledComponentRow } from './component-cell';
import BlockletBundleAvatar from '../bundle-avatar';
import { useNodeContext } from '../../contexts/node';

export default function OptionalComponentCell({
  blocklet,
  ancestors = [],
  meta,
  dependencies = [],
  setInstallComponentMeta,
  logoUrl = '',
}) {
  const node = useNodeContext();
  const { t } = useLocaleContext();

  const handleOpen = () => {
    meta.bundleSource = blocklet.bundleSource || {};
    setInstallComponentMeta(meta);
  };

  const size = 40;

  return (
    <StyledDiv id={`optional-component-${meta.did}`}>
      <div className="cell">
        <div className="component-left">
          <div className="component-logo">
            {logoUrl ? (
              <img
                src={logoUrl}
                onError={() => `${node.imgPrefix}/blocklet.png`}
                alt={meta.title}
                style={{ width: size, height: size }}
              />
            ) : (
              <BlockletBundleAvatar blocklet={blocklet} ancestors={ancestors} />
            )}
          </div>
          <div className="component-header">
            <div className="component-name">{meta.title}</div>
            <div className="component-version">{meta.version}</div>
          </div>
          <Tooltip
            title={[
              `${t('common.dependents')}: `,
              dependencies.map((x) => (
                <Box
                  key={x.parentName + x.mount_point}
                  sx={{
                    pl: 1,
                  }}>{`${x.parentTitle} ${x.required ? `(${t('common.required')})` : ''}`}</Box>
              )),
            ]}>
            <Box
              sx={{
                display: 'flex',
                color: 'primary.main',
                ml: 1,
              }}>
              <Icon icon="octicon:package-dependents-16" />
            </Box>
          </Tooltip>
        </div>
        <div style={{ flex: 1 }} />
        <Box sx={{ minWidth: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleOpen} startIcon={<Icon icon="ph:download-simple-bold" />}>
            {t('common.install')}
          </Button>
        </Box>
      </div>
      <Line class="line" key="line" />
    </StyledDiv>
  );
}

OptionalComponentCell.propTypes = {
  meta: PropTypes.object.isRequired,
  blocklet: PropTypes.object.isRequired,
  ancestors: PropTypes.array,
  setInstallComponentMeta: PropTypes.func.isRequired,
  logoUrl: PropTypes.string,
  dependencies: PropTypes.arrayOf(
    PropTypes.shape({
      parentDid: PropTypes.string,
      parentName: PropTypes.string,
      parentPoint: PropTypes.string,
      required: PropTypes.bool,
    })
  ),
};

const StyledDiv = styled(StyledComponentRow)`
  .line {
    opacity: 0.5;
  }
  .cell {
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .component-left {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    min-width: 0;
  }
  .component-logo {
    width: 40px;
    margin-left: 16px;
    opacity: 0.5;
    border-radius: 10px;
    overflow: hidden;
  }
  .component-header {
    flex: 1;
    min-width: 0;
    opacity: 0.5;
    margin-left: 12px;
    display: flex;
    align-items: center;
    align-items: flex-end;
    cursor: pointer;
  }
  .component-name {
    flex: 1;
    opacity: 0.5;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 16px;
  }
  .component-version {
    opacity: 0.8;
    color: ${({ theme }) => theme.palette.grey[400]};
    font-size: 12px;
    margin-left: 4px;
    transform: translateY(-1px);
  }
`;
