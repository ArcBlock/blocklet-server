import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Buy } from '@blocklet/did-domain-react';
import PropTypes from 'prop-types';

import Toast from '@arcblock/ux/lib/Toast';
import { formatError } from '@blocklet/error';
import { useNodeContext } from '../../../contexts/node';
import { useConflictDomain } from '../hook';

export default function BuyDidDomainAction({
  appId,
  appPk,
  siteId,
  inBlockletSetup,
  teamDid,
  sx = {},
  onAddDomainAlias = () => {},
  ...rest
}) {
  const { api, info } = useNodeContext();
  const { locale, t } = useLocaleContext();
  const { checkConflict } = useConflictDomain();

  const addDomainAlias = async ({ domain, nftDid, chainHost, force }) => {
    const input = {
      id: siteId,
      type: 'nft-domain',
      domainAlias: domain,
      nftDid,
      chainHost,
      teamDid,
      inBlockletSetup,
      force,
    };

    await api.addDomainAlias({ input });

    return input;
  };

  const handleSuccess = async ({ domain, nftDid, chainHost }) => {
    try {
      const input = await addDomainAlias({ domain, nftDid, chainHost, force: false });
      onAddDomainAlias(input);
    } catch (error) {
      if (formatError(error).includes('already exists')) {
        await checkConflict(domain, () => addDomainAlias({ domain, nftDid, chainHost, force: true }));
        return;
      }

      Toast.error(formatError(error));
    }
  };

  return (
    <Buy
      delegatee={appId}
      delegateePk={appPk}
      didDomainURL={info.nftDomainUrl}
      onSuccess={handleSuccess}
      locale={locale}
      variant="outlined"
      sx={sx}
      title={t('router.domainAlias.addDomainNFT.buy')}
      {...rest}
    />
  );
}

BuyDidDomainAction.propTypes = {
  appId: PropTypes.string.isRequired,
  appPk: PropTypes.string.isRequired,
  siteId: PropTypes.string.isRequired,
  inBlockletSetup: PropTypes.bool.isRequired,
  teamDid: PropTypes.string.isRequired,
  sx: PropTypes.object,
  onAddDomainAlias: PropTypes.func,
};
