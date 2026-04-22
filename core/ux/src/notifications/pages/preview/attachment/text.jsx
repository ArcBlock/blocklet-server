import PropTypes from 'prop-types';
import styled from '@emotion/styled';

function TextPreviewPage({ attachment, ...rest }) {
  const { data } = attachment;
  const color = data.color?.toLowerCase() || rest.color;
  const size = data.size || rest.size;
  const fontWeight = data.fontWeight || rest.fontWeight || 400;
  let fontSize = '14px';
  if (size === 'small') {
    fontSize = '12px';
  } else if (size === 'normal') {
    fontSize = '14px';
  } else if (size === 'big') {
    fontSize = '16px';
  } else if (size === 'large') {
    fontSize = '18px';
  }
  return (
    <TextPreview className="title" style={{ fontSize, color, whiteSpace: 'unset', fontWeight }}>
      {data.text}
    </TextPreview>
  );
}

TextPreviewPage.propTypes = {
  attachment: PropTypes.object.isRequired,
};

export default TextPreviewPage;

const TextPreview = styled.span`
  width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
`;
