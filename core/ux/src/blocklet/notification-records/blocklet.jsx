import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import BundleAvatar from '../bundle-avatar';

Blocklet.propTypes = {
  blocklet: PropTypes.object,
  label: PropTypes.string,
};

const BlockletDiv = styled.div`
  display: flex;
  justify-items: flex-start;
  align-items: center;
  gap: 8px;
  .name {
    display: block;
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
export default function Blocklet({ blocklet = null, label = '' }) {
  return (
    <BlockletDiv>
      {blocklet ? (
        <>
          <BundleAvatar size={24} blocklet={blocklet} ancestors={blocklet.ancestors} />
          <span className="name">{blocklet.title || blocklet.meta?.title}</span>
        </>
      ) : (
        <span className="name">{label}</span>
      )}
    </BlockletDiv>
  );
}
