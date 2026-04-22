import { useState } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';

import Toast from '@arcblock/ux/lib/Toast';
import FormTextInput from '../../form/form-text-input';

import { useNodeContext } from '../../contexts/node';
import { withPermission } from '../../permission';
import { isInstalling, formatError, BlockletAdminRoles, formatMountPoint } from '../../util';

function ComponentSetting({ blocklet, ancestors = [], hasPermission = false, ...rest }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const isRoot = !ancestors.length;
  const rootDid = isRoot ? blocklet.meta.did : ancestors.map((x) => x.meta.did)[0];
  const [loading, setLoading] = useState('');
  const [mountPointHelperText, setMountPointHelperText] = useState('');

  const disabled = loading || !hasPermission;

  if (!rootDid) {
    return null;
  }

  if (blocklet.status === 'unknown' && isInstalling(blocklet.status)) {
    return null;
  }

  const onSubmitMountPoint = async (value) => {
    setLoading(true);

    try {
      const input = { rootDid, mountPoint: urlPathFriendly(value) };

      if (!isRoot) {
        input.did = blocklet.meta.did;
      }

      await api.updateComponentMountPoint({ input });
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      err.message = formatError(err);
      Toast.error(err.message);
      throw err;
    }
  };

  const handleMountPointChange = (value) => {
    setMountPointHelperText(t('common.slugifyHint', { value: formatMountPoint(value) }));
  };

  return (
    <Div component="div" {...rest}>
      <Box
        sx={{
          mt: 3,
        }}>
        <FormTextInput
          label={t('blocklet.component.mountPoint')}
          style={{ marginTop: -24 }}
          disabled={loading || disabled}
          loading={loading}
          required
          placeholder={t('blocklet.component.mountPoint')}
          initialValue={blocklet.mountPoint}
          onSubmit={onSubmitMountPoint}
          onChange={handleMountPointChange}
          helperText={mountPointHelperText}
          formatterBeforeSubmit={(value) => urlPathFriendly(value)}
        />
      </Box>
    </Div>
  );
}

const ComponentSettingInDaemon = withPermission(ComponentSetting, 'mutate_blocklets');
const ComponentSettingInService = withPermission(ComponentSetting, '', BlockletAdminRoles);

export default function ComponentSettingWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <ComponentSettingInService {...props} />;
  }

  return <ComponentSettingInDaemon {...props} />;
}

ComponentSetting.propTypes = {
  blocklet: PropTypes.object.isRequired,
  ancestors: PropTypes.array,
  hasPermission: PropTypes.bool,
};

const Div = styled.div``;
