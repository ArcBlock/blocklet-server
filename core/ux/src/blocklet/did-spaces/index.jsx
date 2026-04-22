import PropTypes from 'prop-types';
import { useCreation } from 'ahooks';
import { useSearchParams } from 'react-router-dom';
import { Stack, Box, styled } from '@mui/material';
import { BLOCKLET_APP_SPACE_REQUIREMENT } from '@blocklet/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tabs from '@arcblock/ux/lib/Tabs';
import { useBlockletContext } from '../../contexts/blocklet';
import useMobile from '../../hooks/use-mobile';
import BlockletBackup from './backup';
import BlockletStorage from './storage';
import ListHeader from '../../list-header';

export default function BlockletDIDSpaces({ navOrientation = 'vertical', ...rest }) {
  const { t, locale } = useLocaleContext();
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const isMobile = useMobile({ key: 'md' });
  const [searchParams, setSearchParams] = useSearchParams();
  const current = searchParams.get('tab') || 'backup';
  const orientation = isMobile ? 'horizontal' : navOrientation;

  const tabs = useCreation(() => {
    const results = [
      {
        label: t('common.backup'),
        value: 'backup',
      },
    ];

    /**
     * @type {'required' | 'optional' | undefined}
     */
    const didSpaceAbility = blocklet?.capabilities?.didSpace;

    if (
      didSpaceAbility === BLOCKLET_APP_SPACE_REQUIREMENT.REQUIRED ||
      didSpaceAbility === BLOCKLET_APP_SPACE_REQUIREMENT.REQUIRED_ON_SETUP
    ) {
      results.push({
        label: t('common.storage'),
        value: 'storage',
      });
    }
    return results;
  }, [locale, orientation]);

  const contentMaps = useCreation(() => ({
    backup: <BlockletBackup />,
    storage: <BlockletStorage />,
  }));

  const content = contentMaps[current];

  const onTabChange = (x) => {
    setSearchParams((prev) => {
      if (x === 'backup') {
        prev.delete('tab');
      } else {
        prev.set('tab', x);
      }
      return prev;
    });
  };

  if (tabs.length <= 1) {
    return <ContentBox>{content}</ContentBox>;
  }

  const nav = (
    <Tabs
      tabs={tabs}
      current={current}
      orientation={orientation}
      onChange={onTabChange}
      sx={[
        { borderRight: 1, height: '100%', borderColor: 'divider' },
        orientation === 'horizontal' && { borderRight: 0 },
      ]}
    />
  );

  if (orientation === 'vertical') {
    return (
      <Box {...rest}>
        <Stack
          direction={{ md: 'column', lg: 'row' }}
          sx={{
            gap: 2,
          }}>
          <Box sx={{ flexShrink: 0 }}>
            <ListHeader left={nav} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <ContentBox sx={{ mt: 1 }}>{content}</ContentBox>
          </Box>
        </Stack>
      </Box>
    );
  }

  if (orientation === 'horizontal') {
    return (
      <Box {...rest}>
        <ListHeader left={nav} />
        <ContentBox sx={{ mt: 2 }}>{content}</ContentBox>
      </Box>
    );
  }
}

BlockletDIDSpaces.propTypes = {
  navOrientation: PropTypes.oneOf(['vertical', 'horizontal']),
};

const ContentBox = styled(Box)`
  position: relative;
  min-height: 66vh;
  overflow: hidden;
`;
