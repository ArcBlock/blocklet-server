import PropTypes from 'prop-types';
import capitalize from 'lodash/capitalize';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import CancelIcon from '@mui/icons-material/Cancel';
import styled from '@emotion/styled';

export default function Error({ message, actions }) {
  const { t } = useLocaleContext();

  return (
    <>
      <Body className="body">
        <CancelIcon className="status_icon status_error" />
        <div className="status_title status_error">{capitalize(t('common.failed'))}</div>
        <div className="status_desc">{message}</div>
      </Body>
      {actions && <div className="footer">{actions}</div>}
    </>
  );
}

Error.propTypes = {
  actions: PropTypes.any.isRequired,
  message: PropTypes.string.isRequired,
};

const Body = styled.div`
  .status_error {
    color: #f16e6e;
  }
`;
