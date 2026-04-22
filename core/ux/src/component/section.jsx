import { Stack, Typography, Box } from '@mui/material';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import Required from '../form/required';

export default function Section({
  title,
  desc = '',
  link = '',
  sectionLeftSx = {
    width: '384px',
  },
  sectionRightSx = {},
  children,
  required = false,
  orientation = 'horizontal',
  hideTitle = false,
  ...rest
}) {
  const formattedDesc = useMemo(() => {
    if (!link || typeof desc !== 'string') {
      return desc;
    }

    return desc
      ? desc.replace(/<b>(.*?)<\/b>/g, `<a href="${link}" target="_blank" rel="noopener noreferrer">$1</a>`)
      : '';
  }, [desc, link]);

  return (
    <Div {...rest}>
      <Stack
        className="section"
        direction={orientation === 'vertical' && !hideTitle ? 'column' : { sm: 'column', md: 'row' }}
        sx={{
          gap: orientation === 'vertical' ? 0.5 : { xs: 3, md: 6 },
        }}>
        {!hideTitle ? (
          <Box className="section-left" sx={sectionLeftSx}>
            <Typography className="section-title">
              {title} {required && <Required />}
            </Typography>
            {formattedDesc && typeof formattedDesc === 'string' ? (
              <Box
                className="section-desc"
                sx={{ color: 'text.secondary' }}
                dangerouslySetInnerHTML={{ __html: formattedDesc }}
              />
            ) : (
              formattedDesc
            )}
          </Box>
        ) : null}

        <Stack
          className="section-content"
          direction={orientation === 'vertical' && !hideTitle ? 'column' : { sm: 'column', md: 'row' }}
          sx={{ width: '100%', ...sectionRightSx }}>
          {children}
        </Stack>
      </Stack>
    </Div>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  desc: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  sectionLeftSx: PropTypes.object,
  sectionRightSx: PropTypes.object,
  link: PropTypes.node,
  required: PropTypes.bool,
  orientation: PropTypes.string,
  hideTitle: PropTypes.bool,
};

const Div = styled(Box)`
  display: flex;
  align-items: flex-start;
  width: 100%;

  .section {
    width: 100%;

    .section-left {
      flex-shrink: 0;
      flex-grow: 0;
    }

    .section-title {
      font-weight: 500;
      line-height: 32px;
    }

    .section-desc {
      font-weight: normal;
      font-size: 12px;
      white-space: pre-line;
    }

    .section-content {
      flex-grow: 1;
      align-self: center;
    }
  }

  @media (max-width: 900px) {
    .section-left {
      width: 100%;
    }

    .section-content {
      width: 100% !important;
    }
  }
`;
