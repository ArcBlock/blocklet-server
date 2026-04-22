import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Icon } from '@iconify/react';
import { Box, useMediaQuery } from '@mui/material';
import PropTypes from 'prop-types';
import getSafeUrlWithToast from '../../util/get-safe-url';

function parseLogoUrl(component) {
  return `${component.bundleSource?.store || component.meta.homepage}/assets/${component.meta?.did}/${
    component.meta?.logo || 'logo.png'
  }?v=${component.meta?.version}`;
}

export default function RelatedComponentsDialog({
  installRelated = false,
  meta = null,
  show = false,
  onClose,
  components,
  loading,
}) {
  const { t } = useLocaleContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  if ((!meta, !show)) {
    return null;
  }

  const empty = !loading && components.length === 0;
  const hasList = !loading && components.length !== 0;
  const size = 40;

  return (
    <Dialog
      title={t('blocklet.component.relatedComponents', {
        name: meta.title,
      })}
      maxWidth={false}
      fullWidth={false}
      onClose={(event, reason) => {
        // disable backdropClick
        if (reason === 'backdropClick') {
          return;
        }
        onClose(false);
      }}
      PaperProps={{
        style: isMobile
          ? {
              width: '100%',
              height: window.innerHeight,
            }
          : {
              maxWidth: 500,
              minWidth: 300,
              width: '80%',
            },
      }}
      showCloseButton
      disableEscapeKeyDown
      open>
      {loading && (
        <Box
          sx={{ marginTop: 4, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Box
            component={Icon}
            icon="line-md:loading-loop"
            sx={{
              color: 'primary.main',
              fontSize: 32,
            }}
          />
        </Box>
      )}
      {empty && <Box sx={{ textAlign: 'center' }}>{t('blocklet.component.noDependencies', { name: meta.title })}</Box>}
      {hasList && (
        <Box sx={{ marginBottom: 2 }}>
          {components.map((component) => {
            if (!component.meta) {
              return null;
            }
            const { required } = component;
            let opacity;
            if (installRelated || required) {
              opacity = 1;
            } else {
              opacity = 0.5;
            }
            return (
              <Box
                key={component.meta.did}
                sx={{
                  opacity,
                  padding: '10px 0px',
                  paddingBottom: 0.5,
                  marginTop: 0,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'start',
                  alignItems: 'flex-start',
                }}>
                <img
                  style={{ width: size, height: size, minWidth: size, minHeight: size }}
                  src={parseLogoUrl(component)}
                  alt={component.meta.title}
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'start',
                    alignItems: 'start',
                    flex: 1,
                    marginLeft: 2,
                  }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'start',
                      alignItems: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      '.link-icon': {
                        opacity: 0,
                      },
                      ':hover .link-icon': {
                        opacity: 1,
                      },
                    }}
                    onClick={() => {
                      // FIXME: @liangzhu 不应该使用 homepage 来获得最终地址
                      window.open(
                        // 可能是非本地 url，暂没有渠道获取白名单，需要放开 allowDomains 限制
                        getSafeUrlWithToast(
                          `${component.bundleSource?.store || component.meta.homepage}/blocklets/${component.meta.did}`,
                          { allowDomains: null }
                        ),
                        '_blank'
                      );
                    }}>
                    {component.meta.title}
                    <Box
                      sx={{
                        display: required ? 'inline-block' : 'none',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginLeft: 1,
                      }}>
                      {t('blocklet.component.required')}
                    </Box>
                    <Box
                      sx={{
                        paddingLeft: 1,
                        fontSize: '13px',
                        fontWeight: '400',
                      }}
                      component="span">
                      {component.meta.version}
                      <Box
                        className="link-icon"
                        icon="fluent:open-20-filled"
                        component={Icon}
                        sx={{
                          color: 'primary.main',
                          fontSize: 16,
                          transform: 'translate(6px, 3px)',
                          transition: 'all 0.1s',
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ marginTop: 0, opacity: 0.7 }}>{component.meta.description}</Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Dialog>
  );
}

RelatedComponentsDialog.propTypes = {
  meta: PropTypes.object,
  show: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  installRelated: PropTypes.func,
  components: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
};
