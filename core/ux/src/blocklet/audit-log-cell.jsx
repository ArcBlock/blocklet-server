/* eslint-disable react/prop-types */
import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MarkdownPreview from '@uiw/react-markdown-preview';
import rehypeExternalLinks from 'rehype-external-links';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Avatar, IconButton, Tooltip, useTheme } from '@mui/material';
import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import debounce from 'lodash/debounce';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';

import ShortenLabel from './component/shorten-label';
import extractMarkdownLinks from '../util/extract-markdown-links';

const blockletServerLogo = `
<svg style="width:38px;height:38px;" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M50.152 10.6417L31.72 0L13.288 10.6417V24.7942L1 31.8887V53.1722L19.432 63.8139L31.6902 56.7366L31.72 56.7538L31.7498 56.7366L44.008 63.8139L62.44 53.1722V31.8887L50.152 24.7942V10.6417ZM60.52 32.9972L48.232 25.9027V11.7502L31.72 2.21703L15.208 11.7502V25.9028L2.92 32.9972V52.0636L19.432 61.5968L31.6902 54.5196L31.72 54.5368L31.7498 54.5196L44.008 61.5968L60.52 52.0636V32.9972Z" fill="url(#paint0_linear_606_96)"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M50.1521 24.8307L31.7201 14.189L13.2881 24.8307V46.1141L31.7201 56.7558L50.1521 46.1141V24.8307ZM15.2081 25.9392L31.7201 16.406L48.2321 25.9392V45.0056L31.7201 54.5388L15.2081 45.0056V25.9392ZM28.5464 23.0464C28.6641 22.6342 29.0408 22.3501 29.4695 22.3501H33.9707C34.3993 22.3501 34.776 22.6342 34.8938 23.0464L35.7504 26.0447L37.8696 27.2681L40.8945 26.5109C41.3103 26.4068 41.7447 26.591 41.959 26.9622L44.2096 30.8604C44.424 31.2316 44.3662 31.6998 44.0682 32.0079L41.8999 34.2489V36.6959L44.0682 38.9369C44.3662 39.245 44.424 39.7133 44.2096 40.0845L41.959 43.9827C41.7447 44.3539 41.3103 44.538 40.8945 44.4339L37.8696 43.6767L35.7504 44.9002L34.8938 47.8984C34.776 48.3106 34.3993 48.5947 33.9707 48.5947H29.4695C29.0408 48.5947 28.6641 48.3106 28.5464 47.8984L27.6897 44.9002L25.5706 43.6767L22.5457 44.4339C22.1299 44.538 21.6955 44.3539 21.4812 43.9827L19.2305 40.0845C19.0162 39.7133 19.0739 39.245 19.372 38.9369L21.5402 36.6959V34.2489L19.372 32.0079C19.0739 31.6998 19.0162 31.2316 19.2305 30.8604L21.4812 26.9622C21.6955 26.591 22.1299 26.4068 22.5457 26.5109L25.5706 27.2681L27.6897 26.0447L28.5464 23.0464ZM28.9861 27.5132C29.2018 27.3887 29.3607 27.1851 29.4292 26.9456L30.1936 24.2701H33.2466L34.011 26.9456C34.0794 27.1851 34.2383 27.3887 34.4541 27.5132L37.2459 29.1251C37.4617 29.2497 37.7174 29.2855 37.9591 29.225L40.6583 28.5493L42.1848 31.1932L40.25 33.193C40.0768 33.372 39.9799 33.6114 39.9799 33.8605V37.0843C39.9799 37.3334 40.0768 37.5728 40.25 37.7518L42.1848 39.7516L40.6583 42.3955L37.9591 41.7198C37.7174 41.6593 37.4617 41.6951 37.2459 41.8197L34.4541 43.4316C34.2383 43.5561 34.0794 43.7597 34.011 43.9992L33.2466 46.6747H30.1936L29.4292 43.9992C29.3607 43.7597 29.2018 43.5561 28.9861 43.4316L26.1942 41.8197C25.9785 41.6951 25.7228 41.6593 25.4811 41.7198L22.7819 42.3955L21.2554 39.7516L23.1902 37.7518C23.3634 37.5728 23.4602 37.3334 23.4602 37.0843V33.8605C23.4602 33.6114 23.3634 33.372 23.1902 33.193L21.2554 31.1932L22.7819 28.5493L25.4811 29.225C25.7228 29.2855 25.9785 29.2497 26.1942 29.1251L28.9861 27.5132ZM31.7201 41.6407C28.3134 41.6407 25.5517 38.8791 25.5517 35.4724C25.5517 32.0657 28.3134 29.3041 31.7201 29.3041C35.1268 29.3041 37.8884 32.0657 37.8884 35.4724C37.8884 38.8791 35.1268 41.6407 31.7201 41.6407ZM35.9684 35.4724C35.9684 37.8187 34.0664 39.7207 31.7201 39.7207C29.3738 39.7207 27.4717 37.8187 27.4717 35.4724C27.4717 33.1261 29.3738 31.2241 31.7201 31.2241C34.0664 31.2241 35.9684 33.1261 35.9684 35.4724Z" fill="url(#paint1_linear_606_96)"/>
  <defs>
  <linearGradient id="paint0_linear_606_96" x1="31.72" y1="95.7208" x2="95.488" y2="34.3249" gradientUnits="userSpaceOnUse">
  <stop stop-color="#0FA4B7"/>
  <stop offset="0.494757" stop-color="#1DC1C7"/>
  <stop offset="1" stop-color="#2BE0D7"/>
  </linearGradient>
  <linearGradient id="paint1_linear_606_96" x1="28.4374" y1="99.2464" x2="98.7613" y2="44.9372" gradientUnits="userSpaceOnUse">
  <stop stop-color="#0FA4B7"/>
  <stop offset="0.494757" stop-color="#1DC1C7"/>
  <stop offset="1" stop-color="#2BE0D7"/>
  </linearGradient>
  </defs>
</svg>
`;

export default function AuditLogCell({
  title,
  subTitle,
  titleInfo,
  action,
  createdAt,
  content,
  isLast,
  titleLink,
  avatarUrl,
  inService,
  renderTag,
}) {
  const { locale } = useLocaleContext();
  const { palette } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const textRef = useRef(null);

  const checkOverflow = () => {
    const current = textRef.current?.mdp?.current;
    if (current) {
      setIsOverflowing(current.scrollHeight > current.offsetHeight);
    }
  };

  useEffect(() => {
    const handleResize = debounce(() => {
      setWindowWidth(window.innerWidth);
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkOverflow();
  }, [windowWidth, content]);

  const infoList = useMemo(() => {
    return Object.entries(titleInfo)
      .map(([key, value]) => {
        return { key, value };
      })
      .filter((v) => !!v.value);
  }, [titleInfo]);

  const fixLinksContent = useMemo(() => {
    let nextContent = content;
    if (inService) {
      const links = extractMarkdownLinks(content);
      links.forEach((link) => {
        // 如果包含 `如果是 blocklets 的 members` 链接，应该根据场景来替换跳转的路径
        if (/^(?:\/[^/]+)*\/blocklets\/[^/]+\/members$/.test(link.url)) {
          nextContent = nextContent.replace(link.url, `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/did-connect/members`);
        }
      });
    }
    return nextContent;
  }, [content, inService]);

  return (
    <Box data-cy="log-entry" sx={{ borderBottom: isLast ? 'none' : `1px solid ${palette.divider}`, padding: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, width: '100%' }}>
        <Box sx={{ mt: 0.5 }} className="log-author">
          {avatarUrl ? (
            <Avatar src={avatarUrl} size={36} shape="circle" />
          ) : (
            // eslint-disable-next-line react/no-danger
            <div dangerouslySetInnerHTML={{ __html: blockletServerLogo }} />
          )}
        </Box>
        <Box sx={{ width: 240 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography color="textSecondary" component="p" sx={{ display: 'flex' }}>
              {titleLink ? (
                <Link to={titleLink} target="_blank">
                  <ShortenLabel maxLength={26}>{title}</ShortenLabel>
                </Link>
              ) : (
                <ShortenLabel maxLength={26}>{title}</ShortenLabel>
              )}
            </Typography>
            {typeof renderTag === 'function' && renderTag()}
          </Box>
          <Tooltip
            aria-label="Audit device info"
            title={
              <Box sx={{ color: '#fff', display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                {infoList?.map((item) => {
                  return (
                    <Typography
                      key={item.key}
                      sx={{
                        fontSize: 12,
                        color: '#fff',
                      }}>
                      {`${item.key}: ${item.value}`}
                    </Typography>
                  );
                })}
              </Box>
            }>
            <Typography
              component="span"
              color="textSecondary"
              sx={{
                fontSize: 13,
              }}>
              {subTitle}
              <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: 12, verticalAlign: 'middle' }} />
            </Typography>
          </Tooltip>
        </Box>
        <Box sx={{ width: 200 }}>
          <Typography
            sx={{
              fontSize: '16px',
              color: palette.text.primary,
              backgroundColor: palette.background.default,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
            }}>
            {action}
          </Typography>

          <Typography component="span" color="textSecondary">
            <RelativeTime value={createdAt} locale={locale} type="all" disableTimezone sx={{ fontSize: 12 }} />
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            '.wmde-markdown': {
              bgcolor: 'background.default',
              color: 'text.primary',
              '.code-highlight': { 'white-space': 'pre-wrap;', 'word-break': 'break-all' },
            },
          }}>
          {isOverflowing && isExpanded ? (
            <Typography
              className="log-content"
              color="textPrimary"
              component="div"
              data-color-mode="light"
              gutterBottom
              sx={{
                maxWidth: 'lg',
              }}>
              <MarkdownPreview source={fixLinksContent} rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]} />
            </Typography>
          ) : (
            <Typography
              className="log-content"
              color="textPrimary"
              component="div"
              data-color-mode="light"
              gutterBottom
              sx={{
                maxWidth: 'lg',
                display: isExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isExpanded ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: isExpanded ? 'visible' : 'hidden',
                wordBreak: 'break-word',
              }}>
              <MarkdownPreview
                ref={textRef}
                source={fixLinksContent}
                rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
              />
            </Typography>
          )}
        </Box>
        <Box>
          {isOverflowing && (
            <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <CloseFullscreenIcon sx={{ fontSize: 22 }} /> : <UnfoldMoreIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          )}
          <IconButton size="small">
            <CopyButton sx={{ fontSize: 22 }} content={content} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
