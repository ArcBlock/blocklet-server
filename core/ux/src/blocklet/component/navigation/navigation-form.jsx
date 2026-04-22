import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Autocomplete, Box, FormControl, InputAdornment, TextField, Typography } from '@mui/material';
import { useAsyncEffect, useMemoizedFn, useReactive } from 'ahooks';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import values from 'lodash/values';
import without from 'lodash/without';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import cloneDeep from 'lodash/cloneDeep';
import Toast from '@arcblock/ux/lib/Toast';
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Icon, loadIcon } from '@iconify/react';
import { isMatchSection, checkLink, flattenNavigation } from '@blocklet/meta/lib/parse-navigation-from-blocklet';
import { joinURL, withoutTrailingSlash } from 'ufo';
import isAbsoluteUrl from 'is-absolute-url';
import { NAVIGATION_I18N_FIELDS } from '@abtnode/constant';
import isUrl from 'is-url';

import LocaleTabs from './locale-tabs';
import { useTeamContext } from '../../../contexts/team';
import SimpleSelect from '../../../simple-select';
import IconInput from './icon-input';
import useAppLanguages from '../../../hooks/use-app-languages';

const MAX_TITLE_LENGTH = 24;
const MAX_DESCRIPTION_LENGTH = 48;
const defaultType = 'add';

function IconSuffix({ icon }) {
  const [loaded, setLoaded] = useState(false);
  useAsyncEffect(async () => {
    setLoaded(false);
    await loadIcon(icon);
    setLoaded(true);
  }, [icon]);
  if (icon) {
    if (loaded) {
      return <Icon icon={icon} />;
    }
    return <Icon color="#f06f6e" icon="ic:baseline-error" />;
  }
  return <Icon icon="codicon:blank" />;
}
IconSuffix.propTypes = {
  icon: PropTypes.string.isRequired,
};

export default function NavigationForm({
  ref = null,
  section = '',
  components = [],
  rawNavigations = [],
  onChange = () => {},
  ...rest
}) {
  const { roles } = useTeamContext();
  const { t, locale } = useLocaleContext();
  const { localeMap, defaultLocale } = useAppLanguages();

  const getInitialFormState = useMemoizedFn(() => {
    return {
      title: {
        [defaultLocale]: '',
      },
      description: {
        [defaultLocale]: '',
      },
      link: {
        [defaultLocale]: '',
      },
    };
  });
  const getLocaleList = useMemoizedFn((formState) => {
    return without(
      Array.from(
        new Set(
          NAVIGATION_I18N_FIELDS.flatMap((field) => {
            if (isObject(formState[field])) {
              return Object.keys(formState[field]);
            }
            return [];
          })
        )
      ),
      defaultLocale
    );
  });
  const saveFn = useRef(() => {});
  const state = useReactive({
    isRoot: true,
    type: defaultType,
    linkDisabled: false,
    locale: defaultLocale,
    formState: getInitialFormState(),
    get localeList() {
      return getLocaleList(state.formState);
    },
  });

  const {
    handleSubmit,
    control,
    reset: resetFormValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      id: '',
      title: '',
      description: '',
      icon: '',
      link: '',
      component: '',
      parent: '',
      role: [],
    },
  });

  useEffect(() => {
    NAVIGATION_I18N_FIELDS.forEach((field) => setValue(field, state.formState[field][state.locale]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue, state.locale]);

  const formValues = useWatch({ control }); // 减少父级 re-render
  const watchComponent = formValues.component;
  const watchTitle = formValues.title;
  const watchDescription = formValues.description;
  const watchLink = formValues.link;
  const watchParent = formValues.parent;

  useEffect(() => {
    state.formState.title[state.locale] = watchTitle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTitle]);
  useEffect(() => {
    state.formState.description[state.locale] = watchDescription;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchDescription]);
  useEffect(() => {
    state.formState.link[state.locale] = watchLink;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchLink]);
  useEffect(() => {
    onChange?.(formValues);
  }, [formValues, onChange]);

  const selectedOption = useMemo(() => {
    const parentData = rawNavigations.find((item) => {
      if (watchComponent) {
        const findComponent = components.find((x) => x.name === watchComponent);
        return findComponent.did === item.id;
      }
      return item.id === watchParent;
    });
    return parentData;
  }, [components, rawNavigations, watchComponent, watchParent]);

  const linkPrefix = useMemo(() => {
    if (selectedOption?.component) {
      const findComponent = components.find((item) => item.name === selectedOption.component);
      const { link } = findComponent || {};
      const stringLink = isObject(link) ? link[state.locale] : link;
      if (watchComponent) {
        return withoutTrailingSlash(stringLink);
      }
      const selectedLink = isObject(selectedOption.link) ? selectedOption.link[state.locale] : selectedOption.link;
      return withoutTrailingSlash(joinURL(stringLink, selectedLink || '/'));
    }
    return null;
  }, [components, state.locale, selectedOption, watchComponent]);

  const autocompleteOptions = useMemo(() => {
    const { component } = selectedOption || {};
    const componentBlocklet = components.find((item) => item.name === component);
    const { navigation = [] } = componentBlocklet || {};
    const flattenedNavigation = flattenNavigation(navigation, {
      transform(item, parent) {
        if (parent?.section) {
          item.section = item.section || parent.section;
        }
        return item;
      },
    });

    return (
      flattenedNavigation
        .filter((item) => item.link)
        // 在指定 section 下只展示能够展示的 navigation
        .filter((item) => isMatchSection(item.section, section))
        .map((item) => {
          return {
            label: item.link,
            title: item.title[locale] || item.title,
          };
        })
    );
  }, [selectedOption, components, section, locale]);

  const reset = useMemoizedFn(() => {
    state.isRoot = true;
    state.locale = defaultLocale;
    state.type = defaultType;
    state.linkDisabled = false;
    state.formState = getInitialFormState();
    resetFormValues();
    clearErrors();
    saveFn.current = () => {};
  });

  const patchFormValues = useMemoizedFn((params = {}) => {
    if (state.localeList.length > 0) {
      NAVIGATION_I18N_FIELDS.forEach((field) => {
        if (values(state.formState[field]).length > 1) {
          params[field] = state.formState[field];
        }
      });
    }
    if (isEmpty(params.role)) {
      params.role = undefined;
    }
    return params;
  });

  const add = useMemoizedFn(({ parent } = {}, cb = () => {}) => {
    state.type = 'add';
    state.isRoot = !parent;

    setValue('parent', parent?.id);

    saveFn.current = (params) => {
      cb(params);
    };
  });
  const edit = useMemoizedFn((data = {}, cb = () => {}) => {
    const { id, icon, parent, component, role = [] } = data;
    setValue('id', id);
    setValue('icon', icon);
    if (data.from === 'team-tmpl') {
      state.linkDisabled = true;
    }

    // 此时 state.localeList 为空，需手动获取 localeList
    const localeList = getLocaleList(data);
    const setI18nValue = (value, fieldName) => {
      if (isString(value)) {
        state.formState[fieldName] = localeList.reduce(
          (resData, localeItem) => {
            resData[localeItem] = value;
            return resData;
          },
          {
            [defaultLocale]: value,
          }
        );
      } else if (isObject(value)) {
        state.formState[fieldName] = cloneDeep(value);
      } else {
        state.formState[fieldName] = {};
      }
    };
    NAVIGATION_I18N_FIELDS.forEach((field) => setI18nValue(data[field], field));
    NAVIGATION_I18N_FIELDS.forEach((field) => setValue(field, state.formState[field][state.locale]));

    setValue('component', component);
    setValue('parent', parent);
    setValue('role', role || []);

    state.type = 'edit';
    state.isRoot = !parent;
    saveFn.current = (params) => {
      const pickData = pick(params, ['id', 'title', 'description', 'icon', 'component', 'link', 'role']);
      cb(pickData);
    };
  });

  const validTitle = useMemoizedFn((raw) => {
    const value = raw?.trim();

    if (section !== 'bottomNavigation') {
      if (!value) return t('common.requiredErrorText', { name: t('navigation.form.title') });
      if (value.length > MAX_TITLE_LENGTH) return t('navigation.form.titleTooLong', { len: MAX_TITLE_LENGTH });
    }

    return true;
  });

  const validDescription = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (value && value.length > MAX_DESCRIPTION_LENGTH)
      return t('navigation.form.descriptionTooLong', { len: MAX_DESCRIPTION_LENGTH });
    return true;
  });

  const withDomain = useMemoizedFn((url) => {
    if (url?.startsWith('/')) {
      return new URL(url, window.location.origin).href;
    }
    return url;
  });

  const validIcon = useMemoizedFn(async (raw) => {
    const value = raw?.trim();
    if (value) {
      if (isUrl(withDomain(value))) {
        return true;
      }

      try {
        await loadIcon(value);
      } catch {
        return t('navigation.form.invalidIcon');
      }
    }
    return true;
  });

  const validIconRequired = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (value) {
      return validIcon(value);
    }
    return t('common.requiredErrorText', { name: t('navigation.form.icon') });
  });

  const validLink = useMemoizedFn((raw) => {
    const value = raw?.trim();
    if (!value) {
      if (!state.isRoot) {
        return t('common.requiredErrorText', { name: t('navigation.form.link') });
      }
      return true;
    }
    if (!checkLink(value)) {
      return t('navigation.form.invalidLink');
    }
    return true;
  });

  const handleChangeLocale = useMemoizedFn((currentLocale) => {
    state.locale = currentLocale;
    NAVIGATION_I18N_FIELDS.forEach((field) => {
      if (!state.formState[field][currentLocale]) {
        state.formState[field][currentLocale] = '';
      }
    });
    setTimeout(() => {
      clearErrors();
    });
  });

  const checkFormState = useMemoizedFn(() => {
    const { title, link } = state.formState;
    // tabBar 可以不填 title
    if (section !== 'bottomNavigation') {
      for (const key of Object.keys(title)) {
        const validRes = validTitle(title[key]);
        if (validRes !== true) {
          return validRes;
        }
      }
    }
    for (const key of Object.keys(link)) {
      const validRes = validLink(link[key]);
      if (validRes !== true) {
        return validRes;
      }
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const handleFormSubmit = useMemoizedFn((params) => {
    const checkRes = checkFormState();
    if (checkRes === true) {
      saveFn.current(patchFormValues(params));
    } else {
      Toast.error(checkRes);
    }
  });

  const handleRemoveLocale = useMemoizedFn((currentLocale) => {
    state.locale = defaultLocale;
    NAVIGATION_I18N_FIELDS.forEach((field) => {
      state.formState[field] = omit(state.formState[field], currentLocale);
    });
    onChange?.(formValues);
  });

  const handleAddLocale = useMemoizedFn((newLocale) => {
    state.locale = newLocale;
    NAVIGATION_I18N_FIELDS.forEach((field) => {
      state.formState[field][newLocale] = state.formState[field][defaultLocale];
    });
    onChange?.(formValues);
    setTimeout(() => {
      clearErrors();
    });
  });

  useImperativeHandle(ref, () => {
    return {
      add,
      edit,
      resetImmediate: () => reset(),
      reset: () => setTimeout(() => reset(), 0),
      submit: handleSubmit(handleFormSubmit),
    };
  }, [add, reset, edit, handleSubmit, handleFormSubmit]);

  return (
    <Box {...rest}>
      <LocaleTabs
        sx={{ mb: 1 }}
        onAdd={handleAddLocale}
        onChange={handleChangeLocale}
        onRemoveLocale={handleRemoveLocale}
        defaultLocale={defaultLocale}
        locale={state.locale}
        localeMap={localeMap}
        locales={state.localeList}
      />
      <form noValidate autoComplete="off">
        {section !== 'bottomNavigation' && (
          <Controller
            name="title"
            control={control}
            rules={{ validate: validTitle }}
            render={({ field }) => (
              <TextField
                fullWidth
                variant="outlined"
                margin="dense"
                required
                placeholder={t('navigation.form.titlePlaceholder')}
                label={t('navigation.form.title')}
                disabled={state.isEdit}
                error={!!errors?.title?.message}
                helperText={errors?.title?.message || ' '}
                {...field}
              />
            )}
          />
        )}
        {section === 'bottomNavigation' ? (
          <Controller
            name="icon"
            control={control}
            rules={{ validate: validIconRequired }}
            render={({ field }) => (
              <IconInput
                fullWidth
                required
                variant="outlined"
                margin="dense"
                placeholder={t('navigation.form.iconPlaceholder')}
                label={t('navigation.form.icon')}
                error={!!errors?.icon?.message}
                helperText={errors?.icon?.message}
                disabled={state.locale !== defaultLocale}
                methods={['select']}
                iconifyShape="url"
                {...field}
              />
            )}
          />
        ) : (
          <Controller
            name="icon"
            control={control}
            rules={{ validate: validIcon }}
            render={({ field }) => (
              <IconInput
                fullWidth
                variant="outlined"
                margin="dense"
                placeholder={t('navigation.form.iconPlaceholder')}
                label={t('navigation.form.icon')}
                error={!!errors?.icon?.message}
                helperText={errors?.icon?.message}
                disabled={state.locale !== defaultLocale}
                {...field}
              />
            )}
          />
        )}
        {state.isRoot && (
          <Controller
            name="component"
            control={control}
            render={({ field }) => (
              <SimpleSelect
                fullWidth
                margin="dense"
                disabled={state.locale !== defaultLocale && field.value}
                label={t('navigation.form.component')}
                placeholder={t('navigation.form.componentPlaceholder')}
                options={components.map((item) => ({
                  title: item.title,
                  value: item.name,
                  description: item.link,
                }))}
                error={!!errors?.component?.message}
                helperText={errors?.component?.message || ' '}
                {...omit(field, 'ref')}
              />
            )}
          />
        )}
        {!state.isRoot && ['header'].includes(section) && (
          <Controller
            name="description"
            control={control}
            rules={{ validate: validDescription }}
            render={({ field }) => (
              <TextField
                fullWidth
                variant="outlined"
                margin="dense"
                placeholder={t('navigation.form.descriptionPlaceholder')}
                label={t('navigation.form.description')}
                disabled={state.isEdit}
                error={!!errors?.description?.message}
                helperText={errors?.description?.message || ' '}
                {...field}
              />
            )}
          />
        )}
        <Controller
          name="link"
          control={control}
          rules={{ validate: validLink }}
          render={({ field }) => (
            <FormControl fullWidth margin="dense">
              <Autocomplete
                disablePortal
                freeSolo
                blurOnSelect
                autoSelect
                fullWidth
                disabled={state.linkDisabled}
                isOptionEqualToValue={(option) => option.label}
                options={autocompleteOptions}
                renderInput={(params) => {
                  return (
                    <TextField
                      {...params}
                      placeholder={t('navigation.form.linkPlaceholder')}
                      label={t('navigation.form.link')}
                      error={!!errors?.link?.message}
                      helperText={errors?.link?.message || '/abc/bcd or /abc or https://arcblock.io'}
                      slotProps={{
                        input: {
                          startAdornment: linkPrefix ? (
                            <InputAdornment
                              position="start"
                              sx={{ textDecoration: isAbsoluteUrl(watchLink || '') ? 'line-through' : '' }}>
                              {linkPrefix}
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />
                  );
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    {option.label}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        marginLeft: 1,
                        color: 'text.secondary',
                      }}>
                      {option.title}
                    </Typography>
                  </Box>
                )}
                margin="dense"
                {...field}
                onChange={() => {}}
                onInputChange={(e, value) => {
                  field.onChange(value);
                }}
              />
            </FormControl>
          )}
        />
        {['dashboard', 'sessionManager'].includes(section) && (
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <SimpleSelect
                fullWidth
                multiple
                margin="dense"
                label={t('navigation.form.role')}
                placeholder={t('navigation.form.rolePlaceholder')}
                options={roles.map((role) => ({
                  title: role.title,
                  value: role.name,
                }))}
                error={!!errors?.role?.message}
                helperText={errors?.role?.message || ' '}
                {...omit(field, 'ref')}
              />
            )}
          />
        )}
        {section === 'bottomNavigation' && (
          <Controller
            name="title"
            control={control}
            rules={{ validate: validTitle }}
            render={({ field }) => (
              <TextField
                fullWidth
                variant="outlined"
                margin="dense"
                placeholder={t('navigation.form.titlePlaceholder')}
                label={t('navigation.form.title')}
                disabled={state.isEdit}
                error={!!errors?.title?.message}
                helperText={errors?.title?.message || ' '}
                {...field}
              />
            )}
          />
        )}
      </form>
    </Box>
  );
}

NavigationForm.propTypes = {
  ref: PropTypes.any,
  section: PropTypes.string,
  components: PropTypes.array,
  rawNavigations: PropTypes.array,
  onChange: PropTypes.func,
};
