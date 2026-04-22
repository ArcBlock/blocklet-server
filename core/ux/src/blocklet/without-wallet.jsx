import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import LoginProviderItem from '@arcblock/did-connect-react/lib/Connect/components/login-item/login-method-item';
import passKeyRoundedIcon from '@iconify-icons/material-symbols/passkey-rounded';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function WithoutWallet({ onClick }) {
  const { t } = useLocaleContext();
  return (
    <LoginProviderItem
      title={t('launchBlocklet.withoutWallet')}
      icon={<Icon icon={passKeyRoundedIcon} fontSize="1em" />}
      onClick={onClick}
    />
  );
}

WithoutWallet.propTypes = {
  onClick: PropTypes.func.isRequired,
};
