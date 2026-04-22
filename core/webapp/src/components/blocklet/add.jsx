/* eslint-disable react/jsx-one-expression-per-line */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import AddIcon from '@mui/icons-material/Add';
import Toast from '@arcblock/ux/lib/Toast';
import SplitButton from '@arcblock/ux/lib/SplitButton';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import InstallFromUrl from '@abtnode/ux/lib/blocklet/install-from-url';
import CreateBlocklet from './create-blocklet';

export default function BlockletAdd({ onCreate = () => {} }) {
  const navigate = useNavigate();
  const { t } = useLocaleContext();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [installSetting, setInstallSetting] = useState(null);
  const [createSetting, setCreateSetting] = useState(null);

  const closeInstallFromUrl = () => {
    setInstallSetting(null);
  };

  const openInstallFromUrl = () => {
    setInstallSetting({
      onCancel: () => {
        closeInstallFromUrl();
        setInstallSetting(null);
      },
      onSuccess: () => {
        closeInstallFromUrl();
      },
    });
  };

  const openCreateBlocklet = () => {
    setCreateSetting({
      onCancel: () => {
        setCreateSetting(null);
      },
      onSuccess: (...args) => {
        setCreateSetting(null);
        onCreate(...args);
      },
    });
  };

  const openRestoreBlocklet = () => {
    const url = new URL('http://localhost');
    url.searchParams.set('restoreFrom', 'server');
    url.searchParams.set('serverUrl', window.location.href);
    navigate(`/blocklets/restore${url.search}`);
  };

  const openInstallFromSpaces = () => {
    navigate('/blocklets/restore');
  };

  return (
    <>
      <SplitButton
        onClick={() => navigate('/store')}
        menuButtonProps={{ 'data-cy': 'open-install-menu' }}
        menu={[
          <SplitButton.Item key="1" data-cy="open-install-form" onClick={() => openInstallFromUrl()}>
            {t('blocklet.installFromUrl')}
          </SplitButton.Item>,
          <SplitButton.Item key="2" data-cy="open-create-form" onClick={() => openCreateBlocklet()}>
            {t('blocklet.installFromCreate')}
          </SplitButton.Item>,
          <SplitButton.Item key="3" data-cy="open-install-from-spaces" onClick={() => openInstallFromSpaces()}>
            {t('blocklet.restoreFromSpaces.title')}
          </SplitButton.Item>,
          <SplitButton.Item key="4" data-cy="open-install-from-spaces" onClick={() => openRestoreBlocklet()}>
            {t('blocklet.installFromDiskBackup')}
          </SplitButton.Item>,
        ].filter(Boolean)}>
        <AddIcon />
        {t('blocklet.installFromMarket')}
      </SplitButton>
      {!!error && <Toast variant="error" message={error} onClose={() => setError('')} />}
      {!!success && <Toast variant="success" duration={3000} message={success} onClose={() => setSuccess('')} />}
      {installSetting && <InstallFromUrl onCancel={installSetting.onCancel} onSuccess={installSetting.onSuccess} />}
      {createSetting && <CreateBlocklet onCancel={createSetting.onCancel} onSuccess={createSetting.onSuccess} />}
    </>
  );
}

BlockletAdd.propTypes = {
  onCreate: PropTypes.func,
};
