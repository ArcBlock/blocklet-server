import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';

import {
  defaultActions,
  requiredLanguages,
  isValidActionName,
  getSortedLanguages,
  getLanguageLabel,
} from './constants';

function ActionNameEditor({
  value = '',
  onChange = () => {},
  onBlur = () => {},
  onKeyDown = () => {},
  isDuplicate = false,
}) {
  const { t } = useLocaleContext();
  const isInvalid = value && !isValidActionName(value);

  let helperText = '';
  if (isInvalid) {
    helperText = t('authentication.didConnect.actionNameError');
  } else if (isDuplicate) {
    helperText = t('authentication.didConnect.actionNameDuplicate');
  }

  return (
    <TextField
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
      size="small"
      variant="standard"
      autoFocus
      placeholder="action-name"
      helperText={helperText}
      error={isInvalid || isDuplicate}
      sx={{ '& .MuiInputBase-input': { py: 0, fontSize: 14, fontWeight: 500 } }}
    />
  );
}

ActionNameEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  isDuplicate: PropTypes.bool,
};

function LanguageChip({ langCode, isSelected = false, canDelete = false, onSelect = () => {}, onDelete = () => {} }) {
  return (
    <Chip
      label={getLanguageLabel(langCode)}
      onClick={onSelect}
      onDelete={canDelete ? onDelete : undefined}
      size="small"
      sx={{
        bgcolor: isSelected ? 'primary.main' : 'grey.100',
        color: isSelected ? 'primary.contrastText' : 'text.primary',
        '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'grey.200' },
        '& .MuiChip-deleteIcon': {
          color: isSelected ? 'primary.contrastText' : 'text.secondary',
          '&:hover': { color: isSelected ? 'primary.contrastText' : 'error.main' },
        },
      }}
    />
  );
}

LanguageChip.propTypes = {
  langCode: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
  canDelete: PropTypes.bool,
  onSelect: PropTypes.func,
  onDelete: PropTypes.func,
};

export default function ActionItem({
  actionKey,
  actionData = {},
  expanded = false,
  selectedLang = '',
  editing = {},
  onChange = {},
}) {
  const { t } = useLocaleContext();
  const canEdit = !defaultActions.includes(actionKey);
  const langs = getSortedLanguages(Object.keys(actionData));
  const langData = actionData[selectedLang] || {};
  const isEditing = editing?.actionKey === actionKey;
  const isDuplicate = editing?.name && editing.name !== actionKey && editing.allActions?.[editing.name];

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onChange.accordion(isExpanded)}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
      }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ minHeight: 48, '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 } }}>
        {isEditing ? (
          <ActionNameEditor
            value={editing.name}
            onChange={onChange.editingName}
            onBlur={onChange.finishEditing}
            onKeyDown={onChange.editingKeyDown}
            isDuplicate={isDuplicate}
          />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '&:hover .edit-icon': { opacity: 1 } }}>
            <Typography sx={{ fontWeight: 500 }}>{actionKey}</Typography>
            {canEdit && (
              <IconButton
                className="edit-icon"
                size="small"
                onClick={onChange.startEditing}
                sx={{
                  p: 0.25,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                }}>
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        )}
        {canEdit && (
          <IconButton
            size="small"
            onClick={onChange.delete}
            sx={{ ml: 'auto', mr: 1, p: 0.5, color: 'error.main', '&:hover': { bgcolor: 'error.lighter' } }}>
            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            Languages:
          </Typography>
          {langs.map((langCode) => (
            <LanguageChip
              key={langCode}
              langCode={langCode}
              isSelected={selectedLang === langCode}
              canDelete={!requiredLanguages.includes(langCode)}
              onSelect={() => onChange.language(langCode)}
              onDelete={(e) => onChange.deleteLanguage(langCode, e)}
            />
          ))}
          <Chip
            label={`${t('common.add')}`}
            onClick={onChange.addLanguage}
            size="small"
            variant="outlined"
            icon={<AddIcon sx={{ fontSize: 16 }} />}
            sx={{ borderStyle: 'dashed', '&:hover': { bgcolor: 'action.hover' } }}
          />
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Title"
            value={langData.title || ''}
            onChange={(e) => onChange.field('title', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Scan"
            value={langData.scan || ''}
            onChange={(e) => onChange.field('scan', e.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={2}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

ActionItem.propTypes = {
  actionKey: PropTypes.string.isRequired,
  actionData: PropTypes.object,
  expanded: PropTypes.bool,
  selectedLang: PropTypes.string,
  editing: PropTypes.shape({
    actionKey: PropTypes.string,
    name: PropTypes.string,
    allActions: PropTypes.object,
  }),
  onChange: PropTypes.shape({
    accordion: PropTypes.func,
    language: PropTypes.func,
    field: PropTypes.func,
    startEditing: PropTypes.func,
    editingName: PropTypes.func,
    finishEditing: PropTypes.func,
    editingKeyDown: PropTypes.func,
    delete: PropTypes.func,
    addLanguage: PropTypes.func,
    deleteLanguage: PropTypes.func,
  }),
};
