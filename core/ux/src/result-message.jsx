import styled from '@emotion/styled';
import ResultMessage from '@blocklet/launcher-layout/lib/launch-result-message';

const StyledResultMessage = styled(ResultMessage)`
  && .result-footer {
    height: 120px;
    > div {
      flex-wrap: wrap;
    }
  }
`;

export default StyledResultMessage;
