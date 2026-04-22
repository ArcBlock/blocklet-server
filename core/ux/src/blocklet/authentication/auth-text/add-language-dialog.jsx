import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';

import { baseLanguages } from '@blocklet/constant';
import { getLanguageLabel } from './constants';

export default function AddLanguageDialog({
  open,
  onClose,
  existingLanguages,
  selectedLanguage,
  onLanguageChange,
  onAdd,
}) {
  const { t } = useLocaleContext();
  const availableLanguages = baseLanguages.filter((lang) => !existingLanguages.includes(lang.code));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('authentication.didConnect.addLanguage')}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <Select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            displayEmpty
            size="small"
            renderValue={(value) =>
              value ? (
                getLanguageLabel(value)
              ) : (
                <Typography color="text.secondary">{t('authentication.didConnect.selectLanguage')}</Typography>
              )
            }>
            {availableLanguages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={onAdd} variant="contained" disabled={!selectedLanguage}>
          {t('common.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AddLanguageDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  existingLanguages: PropTypes.array.isRequired,
  selectedLanguage: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};
