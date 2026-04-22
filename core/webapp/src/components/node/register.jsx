import axios from '@abtnode/util/lib/axios';
import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import styled from '@emotion/styled';
import useAsync from 'react-use/lib/useAsync';
import { joinURL } from 'ufo';

import { useNodeContext } from '../../contexts/node';
import { DangerItem, DangerZone } from '../danger-zone';

const LAUNCHER_COMPONENT_DID = 'z8iZkFBbrVQxZHvcWWB3Sa2TrfGmSeFz9MSU7';

export default function RegisterNode() {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();
  const endpoint = getServerUrl(info);
  const { createdAt, did, description, name } = info;

  const registerUrlState = useAsync(async () => {
    const registerUrl = localStorage.getItem('__registerUrl') || info.registerUrl;

    const urlObj = new URL(registerUrl);
    urlObj.pathname = '__blocklet__.js';
    urlObj.searchParams.set('type', 'json');
    const { data } = await axios.get(urlObj.toString());

    const launcherMountPoint = data?.componentMountPoints?.find(x => x.did === LAUNCHER_COMPONENT_DID);

    const registerUrlObj = new URL(registerUrl);
    registerUrlObj.pathname = joinURL(launcherMountPoint?.mountPoint || '', 'register');

    return registerUrlObj;
  });

  const nodeInfo = {
    did,
    name,
    createdAt,
    description,
    url: endpoint,
  };

  if (registerUrlState.loading) {
    return '';
  }

  if (registerUrlState.error) {
    console.error('registerUrlState.error', registerUrlState.error);
    return '';
  }

  const registerUrlObj = registerUrlState.value;

  return (
    <Div>
      <DangerZone className="danger-zone">
        <DangerItem
          title={t('setting.form.register.title')}
          description={t('setting.form.register.description', { url: registerUrlObj.origin })}>
          <Button
            color="primary"
            component="a"
            href={`${registerUrlObj.toString()}?register-server=${encodeURIComponent(JSON.stringify(nodeInfo))}`}
            target="_blank"
            variant="contained"
            size="large">
            {t('setting.form.register.button')}
          </Button>
        </DangerItem>
      </DangerZone>
    </Div>
  );
}

const Div = styled.div`
  .danger-zone {
    margin-top: 1vw;
    width: 100%;
  }
`;
