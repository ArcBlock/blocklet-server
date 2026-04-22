import { UserCenter as UserCenterLayout } from '@blocklet/ui-react/lib/UserCenter';
import { Helmet } from 'react-helmet';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function UserCenter() {
  const { t } = useLocaleContext();

  return (
    <>
      <Helmet>
        <title>{t('pageTitle.userCenter')}</title>
      </Helmet>
      <UserCenterLayout onlyProfile currentTab="" disableAutoRedirect />
    </>
  );
}
