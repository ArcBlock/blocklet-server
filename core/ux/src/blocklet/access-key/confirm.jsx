import { useContext, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Dialog from '@arcblock/ux/lib/Dialog';
import FormControlLabel from '@mui/material/FormControlLabel';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import Button from '@arcblock/ux/lib/Button';
import Checkbox from '@mui/material/Checkbox';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import { joinURL } from 'ufo';

import ClickToCopy from '../../../lib/click-to-copy';
import { useNodeContext } from '../../contexts/node';

export default function ConfirmAccessKey({ onConfirm = () => {}, accessKeyId, accessKeySecret, hideSecret = true }) {
  const { t } = useContext(LocaleContext);
  const [checked, setChecked] = useState(false);
  const [hideAccessSecret, setHideAccessSecret] = useState(() => hideSecret);
  const node = useNodeContext();

  const onChangeSwitch = () => {
    setHideAccessSecret(!hideAccessSecret);
  };

  const handleChange = (event) => {
    setChecked(event.target.checked);
  };

  const serverPath = joinURL(
    window.location.origin,
    process.env.NODE_ENV === 'production' ? node?.info?.routing?.adminPath : ''
  );

  const code = useMemo(() => {
    if (!hideSecret) {
      if (node.inService) {
        return `curl -H "Authorization: Bearer ${accessKeySecret}" "${joinURL(window.blocklet?.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/api/did/session')}"`;
      }

      return `curl -H "Authorization: Bearer ${accessKeySecret}" "${joinURL(serverPath, '/api/did/session')}"`;
    }

    return `\
const Client = require('@blocklet/server-js');
const ensureServerEndpoint = require('@abtnode/util/lib/ensure-server-endpoint');
const { joinURL } = require('ufo');

const { endpoint } = await ensureServerEndpoint("${node.inService ? window.blocklet?.appUrl : serverPath}");
const fullEndpoint = joinURL(endpoint, '/api/gql');

const client = new Client(fullEndpoint);
client.setAuthAccessKey({
  accessKeyId: "${accessKeyId}",
  accessKeySecret: "${accessKeySecret}",
});

const rootDid = '${window.blocklet?.appId || window.blocklet?.appPid || '{rootDid}'}';
const result = await client.getBlocklet(
  { input: { did: rootDid, attachRuntimeInfo: false } },
  { headers: { 'x-access-blocklet': rootDid } }
);
`;
  }, [hideSecret, accessKeyId, accessKeySecret, node.inService, serverPath]);

  const deployCode = useMemo(() => {
    if (!hideSecret) {
      return null;
    }

    return `blocklet deploy --endpoint ${node.inService ? window.blocklet?.appUrl : serverPath} --access-key ${accessKeyId} --access-secret ${accessKeySecret} {blockletPath}/.blocklet/bundle;`;
  }, [hideSecret, accessKeyId, accessKeySecret, node.inService, serverPath]);

  return (
    <Dialog
      title={t('common.createSuccess')}
      fullWidth
      open
      disableEscapeKeyDown
      onClose={(event, reason) => {
        // 点击对话框外部（backdrop）时不关闭
        if (reason !== 'backdropClick') {
          onConfirm();
        }
      }}
      showCloseButton={false}
      actions={
        <div>
          <Button
            disabled={!hideSecret ? false : !checked}
            onClick={onConfirm}
            color="primary"
            autoFocus
            variant="contained"
            data-cy="submit-confirm-dialog">
            {t('common.confirm')}
          </Button>
        </div>
      }
      aria-labelledby="simple-dialog-title">
      <div>
        <Bold>{hideSecret ? t('setting.accessKey.saveSecretTip') : t('setting.accessKey.viewSecret')}</Bold>
      </div>
      <div style={{ marginTop: '20px' }} />
      <Item>
        <Label>{t('setting.accessKey.accessKeyId')}</Label>

        <ClickToCopy>{accessKeyId}</ClickToCopy>
      </Item>

      <Item>
        <Label>{t('setting.accessKey.accessKeySecret')}</Label>

        {hideAccessSecret ? (
          <Button data-cy="show-secret-btn" color="primary" onClick={onChangeSwitch}>
            {t('setting.accessKey.showSecret')}
          </Button>
        ) : (
          <ClickToCopy>{accessKeySecret}</ClickToCopy>
        )}
      </Item>

      {!hideAccessSecret && (
        <Item>
          <Label>{`Access Key ${t('setting.accessKey.usage')}`}</Label>
          <CodeBlock code={code} language="shell" showDefaultText={false} />
          {deployCode && <CodeBlock code={deployCode} language="shell" showDefaultText={false} />}
        </Item>
      )}

      {hideSecret && (
        <div>
          <FormControlLabel
            value="end"
            disabled={hideAccessSecret}
            control={<Checkbox checked={checked} onChange={handleChange} />}
            label={t('setting.accessKey.iKnow')}
            labelPlacement="end"
          />
        </div>
      )}
    </Dialog>
  );
}

ConfirmAccessKey.propTypes = {
  accessKeyId: PropTypes.string.isRequired,
  accessKeySecret: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  hideSecret: PropTypes.bool,
};

const Label = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  margin-bottom: 8px;
`;
const Item = styled.div`
  margin-bottom: 24px;
`;
const Bold = styled.div`
  font-size: 16px;
  font-weight: bold;
`;
