import { useTheme } from '@mui/material';
import MarkdownPreview from '@uiw/react-markdown-preview';
import PropTypes from 'prop-types';
import rehypeExternalLinks from 'rehype-external-links';
import { EmptyIcon } from '@arcblock/icons';
import DOMPurify from 'dompurify';

import StopBox from './stop-box';

function IntroductionPreview({ text }) {
  const { palette } = useTheme();

  if (!text) {
    return <StopBox Icon={EmptyIcon} />;
  }
  return (
    <MarkdownPreview
      style={{
        backgroundColor: palette.background.default,
        color: palette.text.primary,
      }}
      wrapperElement={{
        'data-color-mode': 'light',
      }}
      source={DOMPurify.sanitize(text)}
      rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
    />
  );
}

IntroductionPreview.propTypes = {
  text: PropTypes.string.isRequired,
};

export default IntroductionPreview;
