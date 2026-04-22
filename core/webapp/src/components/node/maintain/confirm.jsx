/* eslint-disable react/prop-types */
import React, { useRef, useState } from 'react'; // eslint-disable-line no-unused-vars

import Spinner from '@mui/material/CircularProgress';
import Button from '@arcblock/ux/lib/Button';
import Toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';

import ConfirmDialog from '../../confirm';
import { DangerZone, DangerItem } from '../../danger-zone';
import { useNodeContext } from '../../../contexts/node';
import { formatError } from '../../../libs/util';
import { useBlockletsContext } from '../../../contexts/blocklets';

export default function MaintainConfirm({ action }) {
  const { t } = useLocaleContext();
  const { info, api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);
  const { data: internalData, externalData } = useBlockletsContext();
  const [restartType, setRestartType] = useState('restartAllBlocklets');
  const restartTypeRef = useRef(restartType);
  restartTypeRef.current = restartType;

  if (action === 'upgrade') {
    if (!info.nextVersion) {
      return null;
    }
  }

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const canRestartAllContainers = info.enableDocker && action === 'restartAllBlocklet';

  const onConfirm = async () => {
    try {
      setLoading(true);
      if (action === 'upgrade') {
        await api.upgradeNodeVersion();
      }
      if (action === 'restart') {
        await api.restartServer();
      }
      if (action === 'restartAllBlocklet') {
        if (canRestartAllContainers && restartTypeRef.current === 'restartAllContainers') {
          await api.restartAllContainers();
          Toast.success(t('setting.form.restartAllContainers.restarting'));
        } else {
          const needRestartStatus = new Set(['running', 'error']);
          const list = [...internalData, ...externalData].filter(
            x => needRestartStatus.has(x.status) || needRestartStatus.has(x.greenStatus)
          );
          const tasks = list.map(blocklet => {
            if (!blocklet || !blocklet.children || !blocklet.meta) {
              return Promise.resolve();
            }
            const componentDids = blocklet.children
              .filter(x => needRestartStatus.has(x.status) || needRestartStatus.has(x.greenStatus))
              .map(x => x.meta.did);
            return api.restartBlocklet({ input: { did: blocklet.meta.did, componentDids } });
          });
          await Promise.all(tasks);
          Toast.success(t('setting.form.restartAllBlocklet.restarting'));
        }
      }
    } catch (err) {
      Toast.error(formatError(err));
    } finally {
      setLoading(false);
      setConfirmSetting(null);
    }
  };

  const setting = {
    title: t(`setting.form.${action}.title`, { version: info.nextVersion }),
    description: t(`setting.form.${action}.dialog`),
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    onConfirm,
    onCancel,
  };

  return (
    <>
      <DangerZone className="danger-zone">
        <DangerItem
          title={t(`setting.form.${action}.title`, { version: info.nextVersion })}
          description={t(`setting.form.${action}.description`)}>
          <Button onClick={() => setConfirmSetting(setting)} color="error" variant="outlined" size="large">
            {loading ? <Spinner size={16} style={{ marginRight: 3 }} /> : null}
            {t(`setting.form.${action}.confirm`)}
          </Button>
        </DangerItem>
      </DangerZone>
      {confirmSetting && (
        <ConfirmDialog
          title={confirmSetting.title}
          description={
            canRestartAllContainers ? (
              <Typography component="div">
                <Typography gutterBottom>{t('blocklet.action.restartDescription')}</Typography>
                <RadioGroup
                  name="removeType"
                  value={restartType}
                  onChange={e => {
                    setRestartType(e.target.value);
                  }}>
                  <FormControlLabel
                    value="restartAllBlocklets"
                    control={<Radio />}
                    label={t('setting.form.restartAllBlocklet.description')}
                  />
                  <FormControlLabel
                    value="restartAllContainers"
                    control={<Radio />}
                    label={t('setting.form.restartAllContainers.description')}
                  />
                </RadioGroup>
              </Typography>
            ) : (
              confirmSetting.description
            )
          }
          confirm={confirmSetting.confirm}
          cancel={confirmSetting.cancel}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </>
  );
}
