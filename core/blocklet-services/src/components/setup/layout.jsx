import ContentLayout from '@abtnode/ux/lib/launch-blocklet/content-layout';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { BlockletEvents } from '@blocklet/constant';
import styled from '@emotion/styled';

import { useNodeContext } from '../../contexts/node';

const Container = styled(ContentLayout)`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .header {
    width: 100%;
    margin-bottom: 34px;
    ${(props) => props.theme.breakpoints.up('md')} {
      margin-bottom: 64px;
    }
  }
  .container-main {
    position: relative;
    flex: 1;
    width: 100%;
  }
  .container-inner {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    overflow-y: auto;
  }
`;

// eslint-disable-next-line react/prop-types
export default function SetupLayout({ children, ...rest }) {
  const { t } = useLocaleContext();

  const {
    ws: { useSubscription },
  } = useNodeContext();

  useSubscription(BlockletEvents.certIssued, (cert) => {
    Toast.success(t('setup.domain.genCertSuccess', { domain: cert.domain }));
  });

  useSubscription(BlockletEvents.certError, (cert) => {
    Toast.error(t('setup.domain.genCertFailed', { domain: cert.domain, message: cert.message }));
  });

  return <Container {...rest}>{children}</Container>;
}
