import BlockletActions from '@abtnode/ux/lib/blocklet/actions';
import { getBlockletUrlParams, getBlockletUrl } from '@abtnode/ux/lib/util';
import { useContext, useMemo } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useBlockletUrlEvaluation } from '@abtnode/ux/lib/hooks/url-evaluation';
import { withPermission } from '../permission';

export default function BlockletActionsInDaemon({ ...rest }) {
  const { locale } = useContext(LocaleContext);
  const Actions = useMemo(() => withPermission(BlockletActions, 'mutate_blocklets'), []);
  const getComponentUrl = ({ mountPoint, blocklet }) =>
    getBlockletUrl({
      blocklet,
      mountPoint,
      params: getBlockletUrlParams(blocklet, locale),
    });

  return <Actions {...rest} getComponentUrl={getComponentUrl} useBlockletUrlEvaluation={useBlockletUrlEvaluation} />;
}
