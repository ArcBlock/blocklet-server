/** @jsxImportSource @emotion/react */
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import Link from '@mui/material/Link';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

export default function Feedback({ infos = [] }) {
  const { t } = useLocaleContext();
  const feedbackUrl = new URL('https://community.arcblock.io/discussions/add');
  infos.forEach((x) => {
    feedbackUrl.searchParams.set(x.label, x.value);
  });

  const infoStr = infos.map((x) => `* ${x.label}: ${x.value}`).join('\n');
  feedbackUrl.searchParams.set('report', 'server');
  feedbackUrl.searchParams.set(
    'context',
    `[Enter feedback here]



<!--
[Server Info]
${infoStr}
* Page: ${window.location.href}
-->
`
  );

  return (
    <Box sx={{ mx: { xs: 0, md: 2 } }}>
      <Link
        sx={{ color: 'text.primary' }}
        target="_blank"
        href={feedbackUrl.href}
        rel="noreferrer"
        style={{ textDecoration: 'underline' }}>
        {t('common.reportIssue')}
      </Link>
    </Box>
  );
}

Feedback.propTypes = {
  infos: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })
  ),
};
