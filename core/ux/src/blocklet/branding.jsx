import React, { useContext } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import { Box, Stack, Button } from '@mui/material';
import Divider from '@mui/material/Divider';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useSetState } from 'ahooks';

import { BLOCKLET_CONFIGURABLE_KEY, SUPPORTED_LANGUAGES } from '@blocklet/constant';
import Toast from '@arcblock/ux/lib/Toast';
import Typography from '@mui/material/Typography';
import { escapeTag } from '@abtnode/util/lib/sanitize';
import FormTextInput from '../form/form-text-input';
import FormAutocompleteInput from '../form/form-autocomplete-input';

import { useNodeContext } from '../contexts/node';
import { isInstalling, BlockletAdminRoles } from '../util';
import { withPermission } from '../permission';
import useAppLogo from '../hooks/use-app-logo';
import LogoUploader from './logo-uploader';
import Section from '../component/section';

import HeaderLogo from '../icons/header-logo.svg?react';
import HeaderLogoDark from '../icons/header-logo-dark.svg?react';
import HeaderLogoEmpty from '../icons/header-logo-empty.svg?react';
import HeaderLogoEmptyDark from '../icons/header-logo-empty-dark.svg?react';
import Favicon from '../icons/favicon.svg?react';
import AppLogoCard from './app-logo';

const languages = Object.keys(SUPPORTED_LANGUAGES).map((x) => ({
  code: x,
  name: SUPPORTED_LANGUAGES[x].nativeName,
  enName: SUPPORTED_LANGUAGES[x].name,
}));

const languagesFilterKeys = ['name', 'enName', 'code'];

function BlockletBranding({ blocklet, onUpdate = () => {}, hasPermission = false, showFields = [], ...rest }) {
  const { api, prefix, getSessionInHeader } = useNodeContext();
  const { t } = useContext(LocaleContext);
  const [state, setState] = useSetState({
    loading: false,
    showTransferOwner: false,
    showConfigVault: false,
  });

  const disabled = state.loading || !hasPermission;
  const {
    logoUrl,
    logoDarkUrl,
    rectLogoUrl,
    rectLogoDarkUrl,
    faviconUrl,
    splashPortraitUrl,
    splashLandscapeUrl,
    ogImageUrl,
  } = useAppLogo({
    blocklet,
  });

  if (isInstalling(blocklet.status)) {
    return null;
  }

  // configurable blocklet environment
  const customLanguages = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LANGUAGES);
  const customUrl = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL);

  const copyrightOwner = blocklet.environments.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_COPYRIGHT_OWNER
  );
  const copyrightYear = blocklet.environments.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_COPYRIGHT_YEAR
  );

  const configurableEnvs = [
    {
      key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_NAME,
      title: t('blocklet.config.name'),
      description: t('blocklet.config.nameDesc'),
      value: blocklet.environments.find((x) => x.key === 'BLOCKLET_APP_NAME').value,
    },
    {
      key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_DESCRIPTION,
      title: t('blocklet.config.description'),
      description: t('blocklet.config.descriptionDesc'),
      value: blocklet.environments.find((x) => x.key === 'BLOCKLET_APP_DESCRIPTION').value,
    },
    {
      key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL,
      title: t('blocklet.config.appUrl'),
      description: t('blocklet.config.appUrlDesc'),
      value: customUrl ? customUrl.value : '',
    },
    {
      key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_COPYRIGHT_OWNER,
      title: t('blocklet.config.copyrightOwner'),
      description: t('blocklet.config.copyrightDesc'),
      value: copyrightOwner ? copyrightOwner.value : '',
    },
    {
      key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_COPYRIGHT_YEAR,
      title: t('blocklet.config.copyrightYear'),
      description: t('blocklet.config.copyrightDesc'),
      value: copyrightYear ? copyrightYear.value : '',
    },
  ];

  const onSubmitConfig = async (key, value) => {
    const params = [
      {
        key,
        value,
      },
    ];

    try {
      setState({ loading: true });
      const { blocklet: data } = await api.configBlocklet({
        input: {
          did: blocklet.meta.did,
          configs: params,
        },
      });
      onUpdate(data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setState({ loading: false });
    }
  };

  return (
    <Div {...rest}>
      {(!showFields.length || showFields.includes('base-info-title')) && (
        <>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('blocklet.config.baseInfo')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('blocklet.config.baseInfoDesc')}
            </Typography>
          </Box>
          <Box className="config-form" component={Divider} sx={{ my: 3 }} />
        </>
      )}
      {(showFields.length ? configurableEnvs.filter((item) => showFields.includes(item.key)) : configurableEnvs).map(
        (item) => (
          <>
            <Section title={item.title} desc={item.description} key={item.key}>
              <FormTextInput
                style={{ marginTop: 0 }}
                disabled={disabled}
                loading={state.loading}
                initialValue={escapeTag(item.value)}
                placeholder={item.title}
                onSubmit={(value) => onSubmitConfig(item.key, value)}
                validate={item.validate}
              />
            </Section>
            <Box
              className="config-form"
              component={Divider}
              sx={{
                my: 3,
              }}
            />
          </>
        )
      )}
      {(!showFields.length || showFields.includes(BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LANGUAGES)) && (
        <>
          <Section title={t('blocklet.config.languages')} desc={t('blocklet.config.languagesDesc')}>
            <FormAutocompleteInput
              style={{ marginTop: 0 }}
              disabled={disabled}
              loading={state.loading}
              options={languages}
              noEmpty
              initialValue={customLanguages ? customLanguages.value.split(',') : ['en', 'zh']}
              onSubmit={(value) => onSubmitConfig('BLOCKLET_APP_LANGUAGES', value)}
              helperText={t('blocklet.config.selectLanguagesTip')}
              placeholder={t('blocklet.config.languagesSearch')}
              filterKeys={languagesFilterKeys}
              renderLabel={(code, item) => {
                if (item.name === item.enName) {
                  return `${item.name} (${code.toUpperCase()})`;
                }
                return `${item.name},  ${item.enName} (${code.toUpperCase()})`;
              }}
            />
          </Section>
          <Box className="config-form" component={Divider} sx={{ my: 3 }} />
        </>
      )}
      {(!showFields.length || showFields.includes('logo-settings-title')) && (
        <>
          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('blocklet.config.logoSettings')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('blocklet.config.logoSettingsDesc')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'warning.main',
              }}>
              {t('blocklet.config.changeImageTip')}
            </Typography>
          </Box>
          <Box className="config-form" component={Divider} sx={{ my: 3 }} />
        </>
      )}
      <Form>
        {(!showFields.length || showFields.includes(BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO)) && (
          <>
            <Section
              title={t('blocklet.config.logoSquare')}
              desc={`${t('blocklet.config.logoSquareDesc')}\n${t('blocklet.config.logoDesc', { width: 512, height: 512, maxSize: 5 })}`}
              link="https://www.didwallet.io/">
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="body2">{t('common.lightMode')}</Typography>
                  <Box sx={{ width: 307, height: 173, position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    <AppLogoCard
                      name={blocklet.environments.find((x) => x.key === 'BLOCKLET_APP_NAME').value}
                      icon={logoUrl}
                      did={blocklet.meta.did}
                    />
                  </Box>
                  <LogoUploader
                    did={blocklet.meta.did}
                    width={80}
                    type="square"
                    prefix={prefix}
                    url={logoUrl}
                    enabled={hasPermission}
                    headers={getSessionInHeader}
                    aspectRatio={1}>
                    <Button variant="outlined" color="primary">
                      {t('common.upload')}
                    </Button>
                  </LogoUploader>
                </Box>
                <Box sx={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="body2">{t('common.darkMode')}</Typography>
                  <Box sx={{ width: 307, height: 173, position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    <AppLogoCard
                      dark
                      name={blocklet.environments.find((x) => x.key === 'BLOCKLET_APP_NAME').value}
                      icon={logoDarkUrl}
                      did={blocklet.meta.did}
                    />
                  </Box>
                  <LogoUploader
                    did={blocklet.meta.did}
                    width={80}
                    type="square-dark"
                    prefix={prefix}
                    url={logoDarkUrl}
                    enabled={hasPermission}
                    headers={getSessionInHeader}
                    aspectRatio={1}>
                    <Button variant="outlined" color="primary">
                      {t('common.upload')}
                    </Button>
                  </LogoUploader>
                </Box>
              </Box>
            </Section>

            <Box
              className="config-form"
              component={Divider}
              sx={{
                my: 3,
              }}
            />
          </>
        )}

        {(!showFields.length || showFields.includes(BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT)) && (
          <>
            <Section title={t('blocklet.config.logoRect')} desc={`${t('blocklet.config.logoRectDesc')}`}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="body2">{t('common.lightMode')}</Typography>
                  <Box sx={{ width: 307, height: 173, position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    {rectLogoUrl ? (
                      <HeaderLogo viewBox="0 0 384 216" sx={{ width: '100%', height: '100%' }} />
                    ) : (
                      <HeaderLogoEmpty viewBox="0 0 384 216" sx={{ width: '100%', height: '100%' }} />
                    )}
                    {rectLogoUrl && (
                      <Box
                        component="img"
                        src={rectLogoUrl}
                        alt="app-logo"
                        sx={{
                          position: 'absolute',
                          top: 112,
                          left: 64,
                          height: 40,
                          objectFit: 'contain',
                          maxWidth: 120,
                        }}
                      />
                    )}
                  </Box>
                  <LogoUploader
                    did={blocklet.meta.did}
                    width={80}
                    height="auto"
                    type="rect"
                    prefix={prefix}
                    url={rectLogoUrl}
                    enabled={hasPermission}
                    headers={getSessionInHeader}
                    aspectRatio={NaN}
                    minWidth={80}
                    minHeight={120}>
                    <Button variant="outlined">{t('common.upload')}</Button>
                  </LogoUploader>
                </Box>
                <Box sx={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="body2">{t('common.darkMode')}</Typography>
                  <Box sx={{ width: 307, height: 173, position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    {rectLogoDarkUrl ? (
                      <HeaderLogoDark viewBox="0 0 384 216" sx={{ width: '100%', height: '100%' }} />
                    ) : (
                      <HeaderLogoEmptyDark viewBox="0 0 384 216" sx={{ width: '100%', height: '100%' }} />
                    )}
                    {rectLogoDarkUrl && (
                      <Box
                        component="img"
                        src={rectLogoDarkUrl}
                        alt="app-logo"
                        sx={{
                          position: 'absolute',
                          top: 112,
                          left: 64,
                          height: 40,
                          objectFit: 'contain',
                          maxWidth: 120,
                        }}
                      />
                    )}
                  </Box>
                  <LogoUploader
                    did={blocklet.meta.did}
                    width={80}
                    height="auto"
                    type="rect-dark"
                    prefix={prefix}
                    url={rectLogoDarkUrl}
                    enabled={hasPermission}
                    headers={getSessionInHeader}
                    aspectRatio={NaN}
                    minWidth={80}
                    minHeight={120}>
                    <Button variant="outlined">{t('common.upload')}</Button>
                  </LogoUploader>
                </Box>
              </Box>
            </Section>
            <Box
              className="config-form"
              component={Divider}
              sx={{
                my: 3,
              }}
            />
          </>
        )}

        {(!showFields.length || showFields.includes(BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON)) && (
          <>
            <Section
              title={t('blocklet.config.logoFavicon')}
              desc={`${t('blocklet.config.logoFaviconDesc')}\n${t('blocklet.config.logoDesc', { width: 512, height: 512, maxSize: 5 })}`}>
              <Box sx={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ width: 307, height: 173, position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                  <Favicon viewBox="0 0 384 216" sx={{ width: '100%', height: '100%' }} />
                  {faviconUrl && (
                    <Box
                      component="img"
                      src={faviconUrl}
                      alt="app-logo"
                      sx={{ position: 'absolute', top: 45, left: 115, width: 44, height: 44, borderRadius: '12px' }}
                    />
                  )}
                </Box>

                <LogoUploader
                  did={blocklet.meta.did}
                  width={80}
                  type="favicon"
                  prefix={prefix}
                  url={faviconUrl}
                  enabled={hasPermission}
                  headers={getSessionInHeader}
                  aspectRatio={1}>
                  <Button variant="outlined">{t('common.upload')}</Button>
                </LogoUploader>
              </Box>
            </Section>

            <Box
              className="config-form"
              component={Divider}
              sx={{
                my: 3,
              }}
            />
          </>
        )}

        {(!showFields.length || showFields.includes(BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT)) && (
          <>
            <Section
              title={t('blocklet.config.splashPortrait')}
              desc={t('blocklet.config.splashDesc')}
              link="https://www.arcsphere.io/">
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  alignSelf: 'flex-start',
                  '.uploader-wrapper': { borderRadius: 0 },
                  flexWrap: 'wrap',
                }}>
                <LogoUploader
                  did={blocklet.meta.did}
                  height={400}
                  width={225}
                  type="splash-portrait"
                  prefix={prefix}
                  url={splashPortraitUrl}
                  enabled={hasPermission}
                  headers={getSessionInHeader}
                  aspectRatio={9 / 16}
                  minWidth={900}
                  minHeight={1000}
                  allowSVG={false}
                />
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    aspectRatio: '16 / 9', // 保持比例
                    position: 'relative',
                  }}>
                  <LogoUploader
                    did={blocklet.meta.did}
                    height="100%"
                    width="100%"
                    type="splash-landscape"
                    prefix={prefix}
                    url={splashLandscapeUrl}
                    enabled={hasPermission}
                    headers={getSessionInHeader}
                    aspectRatio={16 / 9}
                    minWidth={1600}
                    minHeight={900}
                    allowSVG={false}
                  />
                </Box>
              </Box>
            </Section>

            <Box
              className="config-form"
              component={Divider}
              sx={{
                my: 3,
              }}
            />
          </>
        )}

        {/* <Section title={t('blocklet.config.splashLandscape')} desc={t('blocklet.config.splashLandscapeDesc')}>
          <Box sx={{ alignSelf: 'flex-start' }} />
        </Section> */}

        {(!showFields.length || showFields.includes(BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_LANDSCAPE)) && (
          <Section title={t('blocklet.config.ogImage')} desc={t('blocklet.config.ogImageDesc')}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 400,
                aspectRatio: '40 / 21', // 保持比例
                position: 'relative',
                alignSelf: 'flex-start',
                '.uploader-wrapper': { borderRadius: 0 },
              }}>
              <LogoUploader
                did={blocklet.meta.did}
                height="100%"
                width="100%"
                type="og-image"
                prefix={prefix}
                url={ogImageUrl}
                enabled={hasPermission}
                headers={getSessionInHeader}
                aspectRatio={40 / 21}
                minWidth={1200}
                minHeight={630}
                allowSVG={false}
              />
            </Box>
          </Section>
        )}
      </Form>
    </Div>
  );
}

const BlockletEnvironmentInDaemon = withPermission(BlockletBranding, 'mutate_blocklets');
const BlockletEnvironmentInService = withPermission(BlockletBranding, '', BlockletAdminRoles);

export default function BlockletBrandingWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <BlockletEnvironmentInService {...props} />;
  }

  return <BlockletEnvironmentInDaemon {...props} />;
}

BlockletBranding.propTypes = {
  blocklet: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  hasPermission: PropTypes.bool,
  showFields: PropTypes.array,
};

const Div = styled(Box)`
  max-width: 1536px;

  .config-form {
    flex-grow: 1;
    overflow-y: auto;

    ${(props) => props.theme.breakpoints.down('md')} {
      width: 100%;
      flex-shrink: 0;
      transform: translate(0, 0);
    }
  }

  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16px 0;
  }

  .config-label {
    font-weight: bold;
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

const Form = styled(Stack)``;
