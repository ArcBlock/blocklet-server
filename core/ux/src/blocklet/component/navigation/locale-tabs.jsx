/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import { useKeyPress, useMemoizedFn, useReactive } from 'ahooks';
import without from 'lodash/without';
import omit from 'lodash/omit';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Icon } from '@iconify/react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import SimpleSelect from '../../../simple-select';

function LocaleTabs({
  sx = null,
  onAdd = () => {},
  onChange = () => {},
  defaultLocale = 'en',
  locale = '', // current locale
  locales = [], // existed locales without default locale
  localeMap = {}, // all locales
  onRemoveLocale = () => {},
}) {
  const { t } = useLocaleContext();
  const inputRef = useRef();
  const [addLocaleButtonEl, setAddLocaleButtonEl] = useState(null);
  const state = useReactive({
    localeList: [],
    inputLocale: '',
    localeError: '',
  });

  const openChooseLocale = useMemo(() => {
    return !!addLocaleButtonEl;
  }, [addLocaleButtonEl]);

  // current selected locale
  const showLocale = useMemo(() => {
    if (locales.includes(locale)) {
      return locale;
    }
    return defaultLocale;
  }, [locales, locale]);

  const localeTabs = useMemo(() => {
    return state.localeList.filter((k) => !!localeMap[k]);
  }, [state.localeList, localeMap]);

  const localeOptions = useMemo(() => {
    return Object.keys(omit(localeMap, [...state.localeList, defaultLocale])).map((key) => ({
      title: localeMap[key],
      value: key,
    }));
  }, [state.localeList]);

  const defaultLocalLabel = useMemo(() => {
    const label = localeMap[defaultLocale] || Object.values(localeMap)?.[0];
    return `Default (${label})`;
  }, [localeMap]);

  const checkLocale = useMemoizedFn((value) => {
    if (!value) {
      return t('common.requiredErrorText', { name: 'Locale' });
    }
    if (value === defaultLocale || state.localeList.includes(value)) {
      return t('navigation.form.localeExists', { value });
    }
    return true;
  });

  const checkValidLocale = useMemoizedFn((input = '') => {
    const value = input?.trim();
    const checkResult = checkLocale(value);
    if (checkResult !== true) {
      state.localeError = checkResult;
    } else {
      state.localeError = '';
    }
    return checkResult;
  });

  const close = useMemoizedFn(() => {
    setAddLocaleButtonEl(null);
    state.inputLocale = '';
    state.localeError = '';
  });

  const handleAddLocale = useMemoizedFn(() => {
    const value = state.inputLocale?.trim();
    const checkResult = checkValidLocale(value);
    if (checkResult === true) {
      close();
      state.localeList.push(value);
      onAdd(value);
    }
  });

  const handleRemoveLocale = useMemoizedFn((e, value) => {
    e.preventDefault();
    e.stopPropagation();
    state.localeList = without(state.localeList, value);
    onRemoveLocale(value);
  });

  const handleChangeLocale = useMemoizedFn((e) => {
    const { value } = e.target;
    checkValidLocale(value);
    state.inputLocale = value;
  });

  useEffect(() => {
    state.localeList = [...locales];
  }, [locales, state]);

  useKeyPress(
    'enter',
    () => {
      // HACK: 必须加一个延时，否则无法正确关闭 chooseLocale 弹窗
      setTimeout(() => {
        handleAddLocale();
      });
    },
    {
      target: inputRef,
    }
  );

  return (
    <>
      <Tabs
        sx={sx}
        value={showLocale}
        onChange={(e, value) => {
          onChange(value);
        }}>
        <Tab label={defaultLocalLabel} value={defaultLocale} />
        {localeTabs.map((item) => (
          <Tab
            key={item}
            sx={{ position: 'relative' }}
            label={
              <>
                {localeMap[item]}
                <IconButton
                  size="small"
                  color="inherit"
                  sx={{ position: 'absolute', top: 0, right: 0 }}
                  onClick={(e) => {
                    handleRemoveLocale(e, item);
                  }}>
                  <Icon icon="mdi:close" height={14} />
                </IconButton>
              </>
            }
            value={item}
          />
        ))}
        <IconButton
          color="primary"
          disableFocusRipple
          sx={{ width: '48px' }}
          onClick={(e) => {
            setAddLocaleButtonEl(e.currentTarget);
          }}>
          <Icon icon="mdi:plus" />
        </IconButton>
      </Tabs>
      <Popover
        open={openChooseLocale}
        anchorEl={addLocaleButtonEl}
        onClose={close}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}>
        <Box sx={{ p: 2, width: '270px' }}>
          <Typography variant="subtitle2">{t('navigation.form.localePlaceholder')}</Typography>
          <Box
            sx={{
              mt: 1,
            }}>
            <SimpleSelect
              required
              fullWidth
              label="Locale"
              value={state.inputLocale}
              options={localeOptions}
              onChange={handleChangeLocale}
              error={!!state.localeError}
              helperText={state.localeError || ' '}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
            <Button size="small" variant="contained" onClick={handleAddLocale}>
              {t('common.confirm')}
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

LocaleTabs.propTypes = {
  sx: PropTypes.any,
  onAdd: PropTypes.func,
  onChange: PropTypes.func,
  onRemoveLocale: PropTypes.func,
  defaultLocale: PropTypes.string,
  locale: PropTypes.string,
  localeMap: PropTypes.object,
  locales: PropTypes.array,
};

export default LocaleTabs;
