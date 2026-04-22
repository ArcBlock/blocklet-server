import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Switch, FormControlLabel, TextField, Button, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { useNodeContext } from '../contexts/node';

function SubServiceConfig({ blocklet }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { enqueueSnackbar } = useSnackbar();
  const [enabled, setEnabled] = useState(false);
  const [domain, setDomain] = useState('');
  const [staticRoot, setStaticRoot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load initial config from blocklet settings
  // Only reload when blocklet DID changes to avoid infinite re-renders
  useEffect(() => {
    if (blocklet?.settings?.subService) {
      const config = blocklet.settings.subService;
      setEnabled(config.enabled || false);
      setDomain(config.domain || '');
      setStaticRoot(config.staticRoot || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocklet?.meta?.did]);

  // Validate form - memoized to avoid re-renders
  const validationError = useMemo(() => {
    if (!enabled) return null;

    if (!domain) {
      return t('blocklet.subService.error.domainRequired');
    }

    // Basic domain format validation (allow both *.example.com and example.com)
    const domainPattern = /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    if (!domainPattern.test(domain)) {
      return t('blocklet.subService.error.domainFormat');
    }

    if (!staticRoot) {
      return t('blocklet.subService.error.staticRootRequired');
    }

    // Security: Prevent path traversal attacks
    // Reject paths containing ".." or starting with "/"
    if (staticRoot.includes('..') || staticRoot.startsWith('/')) {
      return t('blocklet.subService.error.invalidPath');
    }

    return null;
  }, [enabled, domain, staticRoot, t]);

  const isValid = validationError === null;

  // Check if the domain is a wildcard domain
  const isWildcard = domain.startsWith('*.');

  // Save configuration
  const handleSave = async () => {
    if (!isValid) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const config = enabled
        ? {
            enabled: true,
            domain,
            staticRoot,
          }
        : {
            enabled: false,
          };

      await api.updateBlockletSettings({
        input: {
          did: blocklet.meta.did,
          subService: config,
        },
      });

      enqueueSnackbar(t('blocklet.subService.saveSuccess'), { variant: 'success' });
    } catch (err) {
      setError(err.message || t('common.saveFailed'));
      enqueueSnackbar(t('blocklet.subService.saveFailed', { error: err.message }), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        {t('blocklet.subService.title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('blocklet.subService.description')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          label={t('blocklet.subService.enable')}
        />

        {enabled && (
          <>
            <TextField
              fullWidth
              required
              label={t('blocklet.subService.domain')}
              placeholder={t('blocklet.subService.domainPlaceholder')}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              helperText={t('blocklet.subService.domainHelp')}
            />

            <TextField
              fullWidth
              required
              label={t('blocklet.subService.staticRoot')}
              placeholder={t('blocklet.subService.staticRootPlaceholder')}
              value={staticRoot}
              onChange={(e) => setStaticRoot(e.target.value)}
              helperText={t('blocklet.subService.staticRootHelp')}
            />

            <Alert severity="info">
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t('blocklet.subService.howItWorks')}
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, mt: 1 }}>
                {isWildcard ? (
                  <>
                    <li>{t('blocklet.subService.example1', { relativePath: staticRoot || '{relativePath}' })}</li>
                    <li>{t('blocklet.subService.example2', { relativePath: staticRoot || '{relativePath}' })}</li>
                  </>
                ) : (
                  <>
                    <li>
                      {t('blocklet.subService.singleDomainExample1', { relativePath: staticRoot || '{relativePath}' })}
                    </li>
                    <li>
                      {t('blocklet.subService.singleDomainExample2', { relativePath: staticRoot || '{relativePath}' })}
                    </li>
                  </>
                )}
                <li>{t('blocklet.subService.spaSupport')}</li>
              </Typography>
            </Alert>
          </>
        )}

        <Box>
          <Button variant="contained" onClick={handleSave} disabled={loading || (enabled && !isValid)}>
            {loading ? t('blocklet.subService.saving') : t('blocklet.subService.save')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

SubServiceConfig.propTypes = {
  blocklet: PropTypes.shape({
    meta: PropTypes.shape({
      did: PropTypes.string,
    }),
    settings: PropTypes.shape({
      subService: PropTypes.shape({
        enabled: PropTypes.bool,
        domain: PropTypes.string,
        staticRoot: PropTypes.string,
      }),
    }),
  }).isRequired,
};

export default SubServiceConfig;
