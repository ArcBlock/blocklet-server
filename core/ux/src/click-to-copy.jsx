import { useContext } from 'react';
import PropTypes from 'prop-types';
import Copy from '@arcblock/ux/lib/ClickToCopy';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function ClickToCopy({ children, ...rest }) {
  const { t } = useContext(LocaleContext);
  return (
    <Copy tip={t('common.copyTip')} copiedTip={t('common.copiedTip')} {...rest}>
      {children}
    </Copy>
  );
}

ClickToCopy.propTypes = {
  children: PropTypes.any.isRequired,
};
