import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import CloseIcon from '@mui/icons-material/Close';

export default function PassportTag({ passport, onDelete = null, ...rest }) {
  return (
    <Tag {...rest}>
      {passport.title || passport.name}{' '}
      {!!onDelete && <CloseIcon data-cy="delete-issuance" className="delete" onClick={onDelete} />}
    </Tag>
  );
}

PassportTag.propTypes = {
  passport: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
};

const Tag = styled.span`
  display: inline-flex;
  padding: 2px 8px;
  background: ${(props) => props.theme.palette.primary.main};
  border-radius: 100vw;
  font-weight: 400;
  font-size: 12px;
  line-height: 22px;
  color: #fff;
  align-items: center;
  .delete {
    font-size: 1em;
    margin-left: 6px;
    cursor: pointer;
  }
`;
