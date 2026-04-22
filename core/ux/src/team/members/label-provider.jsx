import { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box } from '@mui/material';
import LabelIcon from '@mui/icons-material/LocalOfferOutlined';

const LabelsContext = createContext(null);

export function MembersLabelsProvider({ children }) {
  const { t } = useLocaleContext();
  const [showManageLabels, setShowManageLabels] = useState(false);

  const labelManageActions = useMemo(() => {
    return (
      <Box
        onClick={() => setShowManageLabels(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          height: 36,
          px: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          fontSize: 14,
          color: 'grey.600',
          cursor: 'pointer',
          textDecoration: 'none',
        }}>
        <LabelIcon style={{ fontSize: 14 }} />
        {t('label.manage')}
      </Box>
    );
  }, [t]);

  const value = useMemo(
    () => ({ showManageLabels, setShowManageLabels, labelManageActions }),
    [showManageLabels, setShowManageLabels, labelManageActions]
  );

  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

MembersLabelsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useMembersLabels() {
  return useContext(LabelsContext);
}
