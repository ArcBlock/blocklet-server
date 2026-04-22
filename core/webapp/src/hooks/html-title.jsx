import { useCreation } from 'ahooks';
import { Helmet } from 'react-helmet';

import { getCommonHtmlTitle } from '../libs/util';
import { useNodeContext } from '../contexts/node';

export default function useHtmlTitle(tab, groupTitle = '') {
  const { info } = useNodeContext();

  const title = useCreation(() => {
    const tabTitle = tab?.breadcrumbsLabel || tab?.label || '';
    return getCommonHtmlTitle(tabTitle, groupTitle, info);
  }, [tab, groupTitle, info]);

  if (title) {
    return (
      <Helmet>
        <title>{title}</title>
      </Helmet>
    );
  }
  return null;
}
