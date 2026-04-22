import { isDidDomain } from '@abtnode/util/lib/url-evaluation';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import AddIcon from '@mui/icons-material/CallMerge';
import Spinner from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';
import useSetState from 'react-use/lib/useSetState';

import Confirm from '../../../confirm';
import { DomainProvider } from '../../../contexts/domain';
import AddDomain from '../add-domain';

function AddDomainAliasComponent({
  id,
  children = null,
  title = '',
  teamDid = '',
  systemDomains,
  appId = null,
  appPk,
  onAddDomainAlias = () => {},
  ...rest
}) {
  const { t } = useLocaleContext();
  const [state, setState] = useSetState({
    loading: false,
    confirmSetting: null,
  });
  const cnameDomain = systemDomains.find((item) => isDidDomain(item));

  const onCancel = () => {
    setState({ loading: false, confirmSetting: null });
  };

  const setting = {
    title: title || t('router.domainAlias.add.title'),
    // eslint-disable-next-line react/no-unstable-nested-components
    description: function Description(params, setParams, setError) {
      return (
        <AddDomain
          siteId={id}
          teamDid={teamDid}
          cnameDomain={cnameDomain}
          onSuccess={(data) => {
            onAddDomainAlias(data);
            setState({ confirmSetting: null });
          }}
          onInputDomain={({ domain, type, error }) => {
            setParams({ ...params, domain, type, __disableConfirm: !!error });
            setError(error);
          }}
          appId={appId}
          appPk={appPk}
          {...rest}
        />
      );
    },
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    params: {
      domain: '',
      __disableConfirm: true,
    },
    onCancel,
  };

  const onMenuItemClick = (e) => {
    e.stopPropagation();
    setState({ confirmSetting: setting });
  };

  return (
    <>
      {typeof children === 'function' ? (
        children({ loading: state.loading, open: onMenuItemClick })
      ) : (
        <MenuItem onClick={onMenuItemClick} className="rule-action" data-cy="action-add-domain-alias">
          {state.loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 18, marginRight: 5 }} />}
          {t('router.domainAlias.add.title')}
        </MenuItem>
      )}

      {state.confirmSetting && (
        <Confirm
          title={state.confirmSetting.title}
          description={state.confirmSetting.description}
          confirm={state.confirmSetting.confirm}
          cancel={state.confirmSetting.cancel}
          params={state.confirmSetting.params}
          onCancel={state.confirmSetting.onCancel}
          showConfirm={false}
          showCancel
          displayError={false}
          color="primary"
          loading={state.loading}
          maxWidth="sm"
        />
      )}
    </>
  );
}

AddDomainAliasComponent.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.any,
  title: PropTypes.string,
  teamDid: PropTypes.string,
  systemDomains: PropTypes.arrayOf(PropTypes.string).isRequired,
  appId: PropTypes.string,
  appPk: PropTypes.string.isRequired,
  onAddDomainAlias: PropTypes.func,
};

export default function AddDomainAlias(props) {
  return (
    <DomainProvider>
      <AddDomainAliasComponent {...props} />
    </DomainProvider>
  );
}
