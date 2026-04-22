import styled from '@emotion/styled';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getDisplayName } from '@blocklet/meta/lib/util';
import ResultMessage from '@blocklet/launcher-layout/lib/launch-result-message';
import ContentLayout from '@abtnode/ux/lib/launch-blocklet/content-layout';

import { useNodeContext } from '../../contexts/node';
import { useLaunchBlockletContext } from '../../contexts/launch-blocklet';
import useQuery from '../../hooks/query';

function Complete() {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();
  const query = useQuery();
  const accessUrl = decodeURIComponent(query.get('accessUrl') || '');
  const { meta } = useLaunchBlockletContext();

  return (
    <Container>
      <div className="body">
        <ResultMessage
          variant="success"
          title={getDisplayName({ meta }, true)}
          subTitle={t('launchBlocklet.installSuccess', { serverName: info.name })}
          footer={
            <Link href={accessUrl} rel="noreferrer" data-cy="open-blocklet">
              {t('common.open')}
            </Link>
          }
        />
      </div>
    </Container>
  );
}

const Link = styled.a`
  display: block;
  height: 36px;
  color: ${props => props.theme.palette.primary.main};
`;

const Container = styled(ContentLayout)`
  .app-info_desc {
    font-weight: 400;
    margin-top: 40px;
    font-size: 18px;
    line-height: 21px;
    color: ${({ theme }) => theme.palette.text.primary};
  }

  .body {
    text-align: center;
  }

  ${props => {
    return props.theme.breakpoints.down('md');
  }} {
    .app-info_desc {
      font-size: 16px;
    }
  }

  .circle_icon {
    font-size: 58px;
    color: ${props => (props.variant === 'error' ? props.theme.palette.error.main : props.theme.palette.success.main)};
  }
`;

export default Complete;
