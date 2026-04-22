import { Box, Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { defaultConfig, configTemplate, defaultAction, defaultActions, isValidActionName } from './constants';
import ActionItem from './action-item';
import AddLanguageDialog from './add-language-dialog';

// TODO: 先禁用添加新的 action
const disabledAddAction = true;

export default function AuthTextVisualMode({
  open = false,
  onClose = () => {},
  onSave = () => {},
  initialConfig = null,
}) {
  const { t, locale } = useLocaleContext();
  const [actions, setActions] = useState({});
  const [expandedAction, setExpandedAction] = useState('login');
  const [selectedLanguages, setSelectedLanguages] = useState({});
  const [addLanguageOpen, setAddLanguageOpen] = useState(false);
  const [addLanguageAction, setAddLanguageAction] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [editingAction, setEditingAction] = useState(null);
  const [editingName, setEditingName] = useState('');

  const currentLocale = locale || 'en';

  useEffect(() => {
    if (!open) return;

    const parsedDialogs = initialConfig || defaultConfig;
    setActions(parsedDialogs);

    const dialogKeys = Object.keys(parsedDialogs);
    setExpandedAction(dialogKeys[0] || 'login');

    const initialSelected = {};
    dialogKeys.forEach((key) => {
      const langs = Object.keys(parsedDialogs[key] || {});
      initialSelected[key] = langs.includes(currentLocale) ? currentLocale : langs[0] || 'en';
    });
    setSelectedLanguages(initialSelected);
    setEditingAction(null);
  }, [open, initialConfig, currentLocale]);

  const isActionEmpty = useMemoizedFn((actionData) => {
    if (!actionData) return true;
    return Object.values(actionData).every((langData) => !langData?.title?.trim() && !langData?.scan?.trim());
  });

  const canAddNewAction = useMemoizedFn(() => {
    const hasEmpty = Object.keys(actions).some((key) => !defaultActions.includes(key) && isActionEmpty(actions[key]));
    return !hasEmpty && !actions[defaultAction];
  });

  const handleAddAction = useMemoizedFn(() => {
    if (!canAddNewAction()) return;

    setActions((prev) => ({ ...prev, [defaultAction]: configTemplate }));
    setExpandedAction(defaultAction);
    setSelectedLanguages((prev) => ({ ...prev, [defaultAction]: currentLocale }));
    setEditingAction(defaultAction);
    setEditingName(defaultAction);
  });

  const handleEditingNameChange = useMemoizedFn((e) => {
    const { value } = e.target;
    if (value === '' || /^[a-z-]*$/.test(value)) {
      setEditingName(value);
    }
  });

  const handleFinishEditing = useMemoizedFn(() => {
    const newName = editingName.trim();

    if (!newName || !isValidActionName(newName) || (newName !== editingAction && actions[newName])) {
      setEditingAction(null);
      return;
    }

    if (newName !== editingAction) {
      const newActions = {};
      Object.keys(actions).forEach((key) => {
        newActions[key === editingAction ? newName : key] = actions[key];
      });
      setActions(newActions);

      if (expandedAction === editingAction) setExpandedAction(newName);
      if (selectedLanguages[editingAction]) {
        setSelectedLanguages((prev) => {
          const updated = { ...prev, [newName]: prev[editingAction] };
          delete updated[editingAction];
          return updated;
        });
      }
    }

    setEditingAction(null);
  });

  const handleEditingKeyDown = useMemoizedFn((e) => {
    if (e.key === 'Enter') handleFinishEditing();
    else if (e.key === 'Escape') setEditingAction(null);
  });

  const handleDeleteAction = useMemoizedFn((actionKey, e) => {
    e.stopPropagation();
    const newActions = { ...actions };
    delete newActions[actionKey];
    setActions(newActions);

    if (expandedAction === actionKey) {
      setExpandedAction(Object.keys(newActions)[0] || false);
    }
  });

  const handleAddLanguage = useMemoizedFn(() => {
    if (!newLanguage || !addLanguageAction) return;

    setActions((prev) => ({
      ...prev,
      [addLanguageAction]: {
        ...prev[addLanguageAction],
        [newLanguage]: { title: '', scan: '', confirm: '', success: '' },
      },
    }));
    setSelectedLanguages((prev) => ({ ...prev, [addLanguageAction]: newLanguage }));
    setAddLanguageOpen(false);
  });

  const handleDeleteLanguage = useMemoizedFn((actionKey, langCode, e) => {
    e.stopPropagation();
    const actionData = actions[actionKey];
    const langs = Object.keys(actionData || {});
    if (langs.length <= 1) return;

    const newActionData = { ...actionData };
    delete newActionData[langCode];
    setActions((prev) => ({ ...prev, [actionKey]: newActionData }));

    if (selectedLanguages[actionKey] === langCode) {
      setSelectedLanguages((prev) => ({ ...prev, [actionKey]: Object.keys(newActionData)[0] || 'en' }));
    }
  });

  const handleSave = useMemoizedFn(() => {
    onSave(JSON.stringify(actions));
    onClose();
  });

  const addEnabled = canAddNewAction();

  const dialogActions = (
    <>
      <Button onClick={onClose} variant="outlined">
        {t('common.cancel')}
      </Button>
      <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
        {t('common.confirm')}
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      title={t('authentication.didConnect.configDialogTitle')}
      actions={dialogActions}>
      <Stack spacing={1.5}>
        {Object.keys(actions).map((actionKey) => {
          const actionData = actions[actionKey] || {};
          const langs = Object.keys(actionData);
          const selectedLang = selectedLanguages[actionKey] || langs[0] || 'en';

          return (
            <ActionItem
              key={actionKey}
              actionKey={actionKey}
              actionData={actionData}
              expanded={expandedAction === actionKey}
              selectedLang={selectedLang}
              editing={{ actionKey: editingAction, name: editingName, allActions: actions }}
              onChange={{
                accordion: (isExpanded) => setExpandedAction(isExpanded ? actionKey : false),
                language: (langCode) => setSelectedLanguages((prev) => ({ ...prev, [actionKey]: langCode })),
                field: (field, value) =>
                  setActions((prev) => ({
                    ...prev,
                    [actionKey]: {
                      ...prev[actionKey],
                      [selectedLang]: { ...prev[actionKey]?.[selectedLang], [field]: value },
                    },
                  })),
                startEditing: (e) => {
                  e.stopPropagation();
                  setEditingAction(actionKey);
                  setEditingName(actionKey);
                },
                editingName: handleEditingNameChange,
                finishEditing: handleFinishEditing,
                editingKeyDown: handleEditingKeyDown,
                delete: (e) => handleDeleteAction(actionKey, e),
                addLanguage: (e) => {
                  e.stopPropagation();
                  setAddLanguageAction(actionKey);
                  setNewLanguage('');
                  setAddLanguageOpen(true);
                },
                deleteLanguage: (langCode, e) => handleDeleteLanguage(actionKey, langCode, e),
              }}
            />
          );
        })}

        {!disabledAddAction && (
          <Box
            onClick={addEnabled ? handleAddAction : undefined}
            sx={{
              border: '2px dashed',
              borderColor: addEnabled ? 'grey.300' : 'grey.200',
              borderRadius: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: addEnabled ? 'pointer' : 'not-allowed',
              color: addEnabled ? 'text.secondary' : 'text.disabled',
              transition: 'all 0.2s',
              ...(addEnabled && {
                '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.lighter' },
              }),
            }}>
            <AddIcon sx={{ mr: 0.5 }} />
            <Typography>{t('authentication.didConnect.addNewAction')}</Typography>
          </Box>
        )}
      </Stack>

      <AddLanguageDialog
        open={addLanguageOpen}
        onClose={() => setAddLanguageOpen(false)}
        existingLanguages={Object.keys(actions[addLanguageAction] || {})}
        selectedLanguage={newLanguage}
        onLanguageChange={setNewLanguage}
        onAdd={handleAddLanguage}
      />
    </Dialog>
  );
}

AuthTextVisualMode.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  initialConfig: PropTypes.object,
};
