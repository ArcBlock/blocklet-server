import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Tabs,
  Tab,
  Button,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
  Dialog,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
} from '@mui/material';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useEffect, useState } from 'react';
import { dockerParseCommand, dockerBuildCommand, allowDockerArgs, dockerCmdValidator } from '@abtnode/docker-utils';
import ResourceDockerInputItem from './resource-docker-input-item';

const exampleDockerCommand = `
docker run --name postgrest
-p 3000:3000
-e PGRST_DB_URI="postgres://username:password@host:port/database"
-e PGRST_DB_SCHEMA="public"
-e PGRST_DB_ANON_ROLE="anon"
postgrest/postgrest
`.trim();

export default function ResourceDocker({ readOnly, paramsErrTip, setParamsErrTip, error, params, setParams }) {
  const { t } = useLocaleContext();
  const [nowTab, setNowTab] = useState('dockerCommand');
  const [dockerCommand, setDockerCommand] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [addItemType, setAddItemType] = useState('--volume');
  const [addItemEnvKey, setAddItemEnvKey] = useState('');

  const [dockerParams, setDockerParams] = useState(dockerParseCommand(dockerCommand));

  const dockerArgs = dockerParams.dockerArgs || [];
  const dockerEnvs = dockerParams.dockerEnvs || [];
  const dockerImage = dockerParams.dockerImage || '';
  const dockerCMD = dockerParams.dockerCommand || '';

  const handleDockerCommandChange = (e) => {
    const { value } = e.target;
    setDockerCommand(value);
  };

  useEffect(() => {
    if (params.blockletDocker && params.blockletDocker.dockerImage && !dockerImage) {
      setDockerParams(params.blockletDocker);
    }
  }, [params, dockerImage, setDockerParams]);

  const handleCommandToParams = (e) => {
    const nextParams = dockerParseCommand(e.target.value);
    setDockerParams((old) => {
      const oldPublish = old.dockerArgs.find((v) => v.key === '--publish' && v.type === 'web');
      let hasWebType = false;
      const setWebType = (item) => {
        item.type = 'web';
        item.path = oldPublish.path || '/';
        item.protocol = oldPublish.protocol || 'http';
        item.prefix = oldPublish.prefix || '/';
        item.name = oldPublish.name || 'publicUrl';
        item.port = oldPublish.port || 'BLOCKLET_PORT';
      };
      nextParams.dockerArgs.forEach((item) => {
        const oldItem = old.dockerArgs.find((v) => v.key === item.key);
        if (oldItem) {
          Object.entries(oldItem).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'value') {
              item[key] = value;
            }
          });

          item.proxyBehavior = item.proxyBehavior || 'server';

          if (item.key === '--publish' && item.type === 'web') {
            if (hasWebType) {
              item.type = 'docker';
            } else {
              setWebType(item);
              hasWebType = true;
            }
          }
        }
      });

      if (oldPublish) {
        const hasPublishWeb = nextParams.dockerArgs.find((v) => v.key === '--publish' && v.type === 'web');
        if (!hasPublishWeb) {
          const lastPublish = nextParams.dockerArgs.find((v) => v.key === '--publish' && v.value === oldPublish.value);
          if (lastPublish) {
            setWebType(lastPublish);
          } else {
            hasWebType = false;
            nextParams.dockerArgs.forEach((item) => {
              if (item.key === '--publish' && !hasWebType) {
                setWebType(item);
                hasWebType = true;
              }
            });
          }
        }
      }

      nextParams.dockerEnvs.forEach((item) => {
        const oldItem = old.dockerEnvs.find((v) => v.key === item.key);
        if (oldItem) {
          Object.entries(oldItem).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'value') {
              item[key] = value;
            }
          });
        }
      });
      return nextParams;
    });
  };

  const dialogConfirm = () => {
    setShowDialog(false);
    if (addItemType === '--env') {
      setDockerParams({
        ...dockerParams,
        dockerEnvs: [
          ...dockerEnvs,
          {
            key: addItemEnvKey,
            value: '',
            custom: '',
            secure: false,
            shared: false,
            required: false,
            description: addItemEnvKey,
          },
        ],
      });
      setAddItemEnvKey('');
      return;
    }
    setDockerParams({
      ...dockerParams,
      dockerArgs: [
        ...dockerArgs,
        { key: addItemType, value: '', type: 'docker', name: '', path: '', prefix: '', protocol: '' },
      ],
    });
  };

  const dialogCancel = () => {
    setShowDialog(false);
    setAddItemEnvKey('');
  };

  const handleDockerImageChange = (e) => {
    const { value } = e.target;
    setDockerParams({
      ...dockerParams,
      dockerImage: value,
    });
    if (value.indexOf(' ') > -1) {
      setParamsErrTip({
        ...paramsErrTip,
        dockerImageName: t('blocklet.publish.docker.dockerImageNameError'),
      });
    } else {
      setParamsErrTip({
        ...paramsErrTip,
        dockerImageName: '',
      });
    }
  };

  const handleDockerCMDChange = (e) => {
    const { value } = e.target;
    setDockerParams({
      ...dockerParams,
      dockerCommand: value,
    });
    try {
      dockerCmdValidator(value);
      setParamsErrTip({
        ...paramsErrTip,
        dockerCMD: '',
      });
    } catch (_) {
      setParamsErrTip({
        ...paramsErrTip,
        dockerCMD: t('blocklet.publish.docker.dockerCMDError'),
      });
    }
  };

  useEffect(() => {
    if (nowTab === 'dockerCommand') {
      setDockerCommand(dockerBuildCommand(dockerParams));
    }
  }, [dockerParams, nowTab]);

  useEffect(() => {
    setParams((prevParams) => {
      return {
        ...prevParams,
        blockletDocker: {
          dockerImage: dockerParams.dockerImage,
          dockerCommand: dockerParams.dockerCommand,
          dockerArgs: dockerParams.dockerArgs,
          dockerEnvs: dockerParams.dockerEnvs,
        },
      };
    });
  }, [dockerParams, setParams]);

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={nowTab} onChange={(_, value) => setNowTab(value)}>
            <Tab value="dockerCommand" label={t('blocklet.publish.docker.dockerCommand')} />
            <Tab value="dockerParams" label={t('blocklet.publish.docker.dockerParams')} />
          </Tabs>
        </Box>
        {nowTab === 'dockerCommand' && (
          <Box>
            <TextField
              disabled={readOnly}
              label={t('blocklet.publish.docker.pleaseInputDockerCommand')}
              placeholder={exampleDockerCommand}
              autoComplete="off"
              variant="outlined"
              fullWidth
              multiline
              spellCheck={false}
              minRows={10}
              value={dockerCommand}
              onChange={handleDockerCommandChange}
              onBlur={handleCommandToParams}
              slotProps={{
                input: {
                  'data-cy': 'blocklet-docker-command',
                  readOnly,
                },
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <Box
                sx={{
                  flex: 1,
                }}
              />
              <Button sx={{ mt: 2 }} variant="contained" onClick={() => setNowTab('dockerParams')}>
                {t('blocklet.publish.docker.nextTab')}
              </Button>
            </Box>
          </Box>
        )}

        {nowTab === 'dockerParams' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              disabled={readOnly}
              label={t('blocklet.publish.docker.dockerImageName')}
              placeholder="Example: docker.io/postgrest/postgrest:latest"
              value={dockerImage}
              sx={{ flex: 1 }}
              color={paramsErrTip.dockerImageName ? 'error' : 'primary'}
              error={!!paramsErrTip.dockerImageName}
              helperText={paramsErrTip.dockerImageName || ''}
              onChange={handleDockerImageChange}
            />
            <TextField
              disabled={readOnly}
              label={`Docker CMD (${t('common.optional')})`}
              placeholder="Docker CMD"
              value={dockerCMD}
              sx={{ flex: 1 }}
              color={paramsErrTip.dockerCMD ? 'error' : 'primary'}
              error={!!paramsErrTip.dockerCMD}
              helperText={paramsErrTip.dockerCMD || ''}
              onChange={handleDockerCMDChange}
            />
            <Box sx={{ height: 4 }} />
            {dockerArgs.map((item, index) => {
              return (
                <ResourceDockerInputItem
                  index={index}
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${item.key}-${index}`}
                  item={item}
                  dockerParams={dockerParams}
                  setDockerParams={setDockerParams}
                  dataKey="dockerArgs"
                  t={t}
                  readOnly={readOnly}
                />
              );
            })}
            {dockerEnvs.map((item, index) => (
              <ResourceDockerInputItem
                // eslint-disable-next-line react/no-array-index-key
                key={`${item.key}-${index}`}
                index={index}
                item={item}
                dockerParams={dockerParams}
                setDockerParams={setDockerParams}
                dataKey="dockerEnvs"
                t={t}
                readOnly={readOnly}
              />
            ))}

            {!readOnly && (
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }} />
                <Button onClick={() => setShowDialog(true)}>{t('blocklet.publish.docker.addItem')}</Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
      {!!error && (
        <Box
          sx={{
            color: 'error.main',
            mt: 1,
            fontSize: 14,
          }}>
          {error}
        </Box>
      )}
      {showDialog && (
        <Dialog fullWidth open>
          <DialogTitle>{t('blocklet.publish.docker.addItem')}</DialogTitle>
          <DialogContent>
            <FormControl sx={{ mt: 1, width: '100%', minWidth: 480, maxWidth: '100%' }}>
              <Select
                labelId="demo-simple-select-helper-label"
                id="demo-simple-select-helper"
                value={addItemType}
                sx={{ width: '100%' }}
                onChange={(e) => setAddItemType(e.target.value)}>
                {Object.keys(allowDockerArgs).map((key) => (
                  <MenuItem value={key}>{key}</MenuItem>
                ))}
              </Select>
              {addItemType === '--publish' && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                  }}>
                  {t('blocklet.publish.docker.publishTips')}
                </Typography>
              )}
              {addItemType === '--volume' && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                  }}>
                  {t('blocklet.publish.docker.volumeTips')}
                </Typography>
              )}
              {addItemType === '--env' && (
                <Box sx={{ mt: 3, width: '100%' }}>
                  <TextField
                    value={addItemEnvKey}
                    onChange={(e) => setAddItemEnvKey(e.target.value)}
                    sx={{ width: '100%' }}
                    label={t('blocklet.publish.docker.envKey')}
                  />
                  <FormHelperText>{t('blocklet.publish.docker.dockerArgValue')}</FormHelperText>
                </Box>
              )}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={dialogCancel}>{t('common.cancel')}</Button>
            <Button onClick={dialogConfirm}>{t('common.confirm')}</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

ResourceDocker.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired,
  setParams: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
  setParamsErrTip: PropTypes.func.isRequired,
  paramsErrTip: PropTypes.func.isRequired,
};
