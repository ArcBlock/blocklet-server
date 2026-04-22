/* eslint-disable react/prop-types */
import React from 'react';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import SwitchControl from '@arcblock/ux/lib/Switch';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Toast from '@arcblock/ux/lib/Toast';
import { useMemoizedFn } from 'ahooks';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import merge from 'lodash/merge';
import isNil from 'lodash/isNil';
import { SESSION_TTL, SESSION_CACHE_TTL } from '@abtnode/constant';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Section from '../../component/section';

import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';

const defaultForm = {
  ttl: SESSION_TTL,
  cacheTtl: SESSION_CACHE_TTL,
  email: {
    enabled: false,
    requireVerified: false,
    requireUnique: false,
    trustOauthProviders: false,
    trustedIssuers: [],
    enableDomainBlackList: false,
    domainBlackList: [],
    enableDomainWhiteList: false,
    domainWhiteList: [],
  },
  phone: {
    enabled: false,
    requireVerified: false,
    requireUnique: false,
    regionBlackList: [],
    trustedIssuers: [],
  },
  enableBlacklist: false,
};

function Switch(props) {
  return <SwitchControl {...props} sx={{ transform: 'scale(0.75)' }} />;
}

function fixTtl(data, reverse = false) {
  const ttl = reverse ? data.ttl * 86400 : data.ttl / 86400;
  return {
    ...data,
    ttl,
  };
}

export default function SessionSettings() {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const did = blocklet?.meta?.did;

  const sessionSettings = merge({}, defaultForm, blocklet?.settings?.session || {});
  // NOTICE: 由于 blocklet?.settings?.session 的默认值已经变成 null，所以此处的 default 判断赋值逻辑需要变更
  if (isNil(sessionSettings.ttl)) {
    sessionSettings.ttl = defaultForm.ttl;
  }
  if (isNil(sessionSettings.cacheTtl)) {
    sessionSettings.cacheTtl = defaultForm.cacheTtl;
  }
  if (!sessionSettings.phone) {
    sessionSettings.phone = defaultForm.phone;
  }
  if (!sessionSettings.email) {
    sessionSettings.email = defaultForm.email;
  }
  if (isNil(sessionSettings.enableBlacklist)) {
    sessionSettings.enableBlacklist = defaultForm.enableBlacklist;
  }

  const { handleSubmit, control, formState, reset, watch } = useForm({
    defaultValues: pick(fixTtl(sessionSettings), ['ttl', 'cacheTtl', 'email', 'phone', 'enableBlacklist']),
  });
  const { t } = useLocaleContext();

  const emailEnabled = watch('email.enabled');
  const phoneEnabled = watch('phone.enabled');
  const enableDomainBlackList = watch('email.enableDomainBlackList');
  const enableDomainWhiteList = watch('email.enableDomainWhiteList');

  const {
    fields: blackListFields,
    append: appendBlackList,
    remove: removeBlackList,
  } = useFieldArray({
    control,
    name: 'email.domainBlackList',
  });

  const {
    fields: whiteListFields,
    append: appendWhiteList,
    remove: removeWhiteList,
  } = useFieldArray({
    control,
    name: 'email.domainWhiteList',
  });

  const onSubmit = useMemoizedFn(async (data) => {
    try {
      const { blocklet: blockletChanged } = await api.updateAppSessionConfig({
        input: {
          did,
          config: omit(fixTtl(data, true), ['phone']),
        },
      });

      const defaultValues = Object.assign(
        {},
        defaultForm,
        pick(blockletChanged?.settings?.session || {}, ['ttl', 'cacheTtl', 'email', 'phone', 'enableBlacklist'])
      );
      reset(fixTtl(defaultValues));
      Toast.success(t('common.configSuccess'));
    } catch (err) {
      Toast.error(err.message);
    }
  });

  return (
    <Div onSubmit={handleSubmit(onSubmit)}>
      <Stack
        direction="column"
        sx={{
          gap: 6,
        }}>
        <Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}>
              {t('blocklet.config.session.profile')}
            </Typography>
            <Box
              component={Divider}
              sx={{
                my: 3,
              }}
            />
          </Box>

          <Stack
            sx={{
              gap: 2,
            }}>
            <Section title={t('blocklet.config.session.fullNameEnabled')} sectionLeftSx={{ width: '600px' }}>
              <Box sx={{ alignSelf: 'flex-start' }}>
                <Switch disabled checked />
              </Box>
            </Section>

            <Section title={t('blocklet.config.session.avatarEnabled')} sectionLeftSx={{ width: '600px' }}>
              <Box sx={{ alignSelf: 'flex-start' }}>
                <Switch disabled checked />
              </Box>
            </Section>

            <Section title={t('blocklet.config.session.emailEnabled')} sectionLeftSx={{ width: '600px' }}>
              <Box sx={{ alignSelf: 'flex-start' }}>
                <Controller
                  name="email.enabled"
                  control={control}
                  render={({ field }) => {
                    return <Switch {...field} checked={field.value} />;
                  }}
                />
              </Box>
            </Section>

            {emailEnabled && (
              <Stack
                direction="column"
                sx={{
                  ml: 2,
                  gap: 0.5,
                }}>
                <Section title={t('blocklet.config.session.emailRequireVerified')} sectionLeftSx={{ width: '600px' }}>
                  <Box sx={{ alignSelf: 'flex-start' }}>
                    <Controller
                      name="email.requireVerified"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                      )}
                    />
                  </Box>
                </Section>

                <Section title={t('blocklet.config.session.emailRequireUnique')} sectionLeftSx={{ width: '600px' }}>
                  <Box sx={{ alignSelf: 'flex-start' }}>
                    <Controller
                      name="email.requireUnique"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                      )}
                    />
                  </Box>
                </Section>

                <Section
                  title={t('blocklet.config.session.emailTrustOauthProviders')}
                  sectionLeftSx={{ width: '600px' }}>
                  <Box sx={{ alignSelf: 'flex-start' }}>
                    <Controller
                      name="email.trustOauthProviders"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                      )}
                    />
                  </Box>
                </Section>

                <Section title={t('blocklet.config.session.enableDomainBlackList')} sectionLeftSx={{ width: '600px' }}>
                  <Box sx={{ alignSelf: 'flex-start' }}>
                    <Controller
                      name="email.enableDomainBlackList"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                      )}
                    />
                  </Box>
                </Section>

                {enableDomainBlackList && (
                  <Box>
                    {blackListFields.map((field, index) => (
                      <Stack
                        key={field.id}
                        direction="row"
                        sx={{
                          alignItems: 'center',
                          my: 1,
                          maxWidth: '720px',
                        }}>
                        <Controller
                          name={`email.domainBlackList.${index}`}
                          control={control}
                          render={(props) => <TextField {...props.field} size="small" fullWidth />}
                        />
                        <IconButton onClick={() => removeBlackList(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={() => appendBlackList('')}>
                      {t('blocklet.config.session.addDomain')}
                    </Button>
                  </Box>
                )}

                <Section title={t('blocklet.config.session.enableDomainWhiteList')} sectionLeftSx={{ width: '600px' }}>
                  <Box sx={{ alignSelf: 'flex-start' }}>
                    <Controller
                      name="email.enableDomainWhiteList"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                      )}
                    />
                  </Box>
                </Section>

                {enableDomainWhiteList && (
                  <Box>
                    {whiteListFields.map((field, index) => (
                      <Stack
                        key={field.id}
                        direction="row"
                        sx={{
                          alignItems: 'center',
                          my: 1,
                          maxWidth: '720px',
                        }}>
                        <Controller
                          name={`email.domainWhiteList.${index}`}
                          control={control}
                          render={(props) => <TextField {...props.field} size="small" fullWidth />}
                        />
                        <IconButton onClick={() => removeWhiteList(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={() => appendWhiteList('')}>
                      {t('blocklet.config.session.addDomain')}
                    </Button>
                  </Box>
                )}
              </Stack>
            )}

            <Box sx={{ display: 'none' }}>
              <Section title={t('blocklet.config.session.phoneEnabled')} sectionLeftSx={{ width: '600px' }}>
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Controller
                    name="phone.enabled"
                    control={control}
                    disabled
                    render={({ field }) => (
                      <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                    )}
                  />
                </Box>
              </Section>

              {phoneEnabled && (
                <Stack
                  direction="column"
                  sx={{
                    ml: 2,
                    mt: 1,
                  }}>
                  <Section title={t('blocklet.config.session.phoneRequireVerified')} sectionLeftSx={{ width: '600px' }}>
                    <Box sx={{ alignSelf: 'flex-start' }}>
                      <Controller
                        name="phone.requireVerified"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                        )}
                      />
                    </Box>
                  </Section>

                  <Section title={t('blocklet.config.session.phoneRequireUnique')} sectionLeftSx={{ width: '600px' }}>
                    <Box sx={{ alignSelf: 'flex-start' }}>
                      <Controller
                        name="phone.requireUnique"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                        )}
                      />
                    </Box>
                  </Section>
                </Stack>
              )}
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
            }}>
            {t('blocklet.config.session.period')}
          </Typography>
          <Box
            component={Divider}
            sx={{
              my: 3,
            }}
          />

          <Stack direction="column" spacing={2}>
            <Controller
              name="ttl"
              control={control}
              rules={{ min: 1, max: 30 }}
              render={({ field }) => (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Section
                    title={t('blocklet.config.session.ttl', { day: field.value })}
                    sectionLeftSx={{ width: '600px' }}>
                    <Box sx={{ width: '100%', maxWidth: 500, px: 2 }}>
                      <Slider
                        {...field}
                        defaultValue={7}
                        step={1}
                        marks={[
                          { value: 1, label: t('blocklet.config.session.day', { day: 1 }) },
                          { value: 7, label: t('blocklet.config.session.days', { day: 7 }) },
                          { value: 14, label: t('blocklet.config.session.days', { day: 14 }) },
                          { value: 21, label: t('blocklet.config.session.days', { day: 21 }) },
                          { value: 30, label: t('blocklet.config.session.days', { day: 30 }) },
                        ]}
                        min={1}
                        max={30}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  </Section>
                </FormControl>
              )}
            />
          </Stack>
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
            }}>
            {t('blocklet.config.session.experimentalSettings')}
          </Typography>
          <Box
            component={Divider}
            sx={{
              my: 3,
            }}
          />

          <Stack direction="column" spacing={2}>
            <Section title={t('blocklet.config.session.enableBlacklist')} sectionLeftSx={{ width: '600px' }}>
              <Box sx={{ alignSelf: 'flex-start' }}>
                <Controller
                  name="enableBlacklist"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel sx={{ ml: 0 }} control={<Switch {...field} checked={field.value} />} />
                  )}
                />
              </Box>
            </Section>
          </Stack>
        </Box>

        <Box>
          <Button type="submit" variant="contained" disabled={!formState.isDirty}>
            {t('common.save')}
          </Button>
        </Box>
      </Stack>
    </Div>
  );
}

const Div = styled.form`
  max-width: 1536px;

  .advanced-config {
    border: 0;
    padding: 0;
  }

  .config-form {
    flex-grow: 1;
    overflow-y: auto;
    will-change: transform;

    &:first-child {
      margin: 0;
    }

    ${(props) => props.theme.breakpoints.down('md')} {
      width: 100%;
      flex-shrink: 0;
      padding: 0 24px;
      transform: translate(0, 0);
    }
  }

  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .config-desc {
    font-weight: normal;
    font-size: 12px;
    color: #666;
  }

  .form-item {
    margin-top: 0;
  }
`;
