import '@iconify/iconify';
import Tooltip from '@mui/material/Tooltip';

import WizardModal from '@blocklet/ui-react/lib/common/wizard-modal';
import WandIcon from '@iconify-icons/tabler/wand';
import { Icon } from '@iconify/react';
import IconButton from '@mui/material/IconButton';
import { useMemo, useState } from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box } from '@mui/material';
import Typography from '@arcblock/ux/lib/Typography';
import { BlockletAdminRoles } from '@abtnode/ux/lib/util';
import { useSessionContext } from '../../contexts/session';

export default function WizardAddon() {
  const { session } = useSessionContext();
  const [showTooltip, setShowTooltip] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { t } = useLocaleContext();

  const finishedWizard = useMemo(() => {
    return !!localStorage.getItem('wizard-finished');
  }, []);

  const isAdmin = useMemo(() => {
    return session.user?.role && BlockletAdminRoles.includes(session.user.role);
  }, [session]);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Tooltip
        key={`wizard-toggle-${showTooltip}`}
        title={t('setup.wizardTooltip')}
        open={showTooltip}
        placement="bottom"
        arrow>
        <IconButton
          size="small"
          onClick={() => {
            setWizardOpen(true);
            setShowTooltip(false); // 点击后隐藏 tooltip
          }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            color: 'text.secondary',
            ...(showTooltip && {
              backgroundColor: 'action.hover',
              '@keyframes pulse': {
                '0%': { opacity: 0.8 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 0.8 },
              },
              animation: 'pulse 2s infinite',
            }),
          }}>
          <Icon icon={WandIcon} height={20} />
        </IconButton>
      </Tooltip>
      <WizardModal
        key="wizard-modal"
        show={wizardOpen}
        loadingText={
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 2, maxWidth: '80vw' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {t('setup.wizardLoading')}
            </Typography>
            {!finishedWizard && (
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {t('setup.wizardSubTitle')}
              </Typography>
            )}
          </Box>
        }
        slotProps={{ paper: { sx: { height: { xs: '100vh', md: '750px' } } } }}
        onChangeVisible={(visible) => {
          setWizardOpen(visible);
          if (!visible && wizardOpen) {
            setShowTooltip(true);
          }
        }}
        onClose={undefined}
        onFinished={() => {
          setWizardOpen(false);
          setShowTooltip(false);
        }}
      />
    </>
  );
}
