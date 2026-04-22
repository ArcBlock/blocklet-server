/* eslint-disable react/require-default-props */
import { memo, useMemo, useState, useEffect } from 'react';
import { Box, Typography as MTypography, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import isEmpty from 'lodash/isEmpty';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html';
import DOMPurify from 'dompurify';
import { Link, toTextList, getLink as getLinkUtil } from '@abtnode/util/lib/notification-preview/highlight';
import { isSameAddr } from '@abtnode/util/lib/notification-preview/func';
import NotificationPreviewPage from './preview';
import { getUserProfileUrl } from './preview/utils';

const sanitize = (innerHtml) => {
  return DOMPurify.sanitize(innerHtml, {
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'style'],
  });
};

const getLink = async (item, locale) => {
  const { type, did } = item;
  if (isSameAddr(type, 'did')) {
    const profileUrl = await getUserProfileUrl(did, locale);
    return profileUrl || getLinkUtil(item);
  }
  return getLinkUtil(item);
};

/**
 * 判断字符串是否超过 10KB
 */
function isStringExceeds10KB(str) {
  const byteSize = new TextEncoder().encode(str).length;
  return byteSize >= 10000;
}

const toClickableSpan = async (str, locale, isHighLight = true) => {
  // 历史原因，执行 docker 命令报错后会把调用栈存储，导致页面卡死
  // 在这里需要判断 str 的大小，如果太大需要截取，默认最多显示 10KB
  let displayStr = str;
  if (isStringExceeds10KB(str)) {
    displayStr = str.slice(0, 10000);
  }
  const textList = toTextList(displayStr);
  const result = await Promise.all(
    textList.map(async (item) => {
      if (item instanceof Link) {
        if (isHighLight) {
          const url = await getLink(item, locale);
          const { type, chainId, did } = item;

          // HACK: 邮件中无法支持 dapp 的展示，缺少 dapp 链接，只能作为加粗展示
          if (isSameAddr(type, 'dapp')) {
            return `<em style="font-weight:bold;" data-type="${type}" data-chain-id="${chainId}" data-did="${did}">${item.text}</em>`;
          }
          if (url) {
            return `<a target="_blank" rel="noopener noreferrer" style="color:#4598fa;font-weight:bold;" href="${url}">${item.text}</a>`;
          }

          // 默认展示为加粗
          return `<em style="font-weight:bold;" data-type="${type}" data-chain-id="${chainId}" data-did="${did}">${item.text}</em>`;
        }
        return item.text;
      }

      return item;
    })
  ).then((results) => results.join(''));
  return result;
};

/**
 * 消息详情内容
 */
NotificationContent.propTypes = {
  notification: PropTypes.object,
  rows: PropTypes.number,
  minimal: PropTypes.bool, // 是否只显示 description
};

function NotificationContent({ notification, rows = 2, minimal = false }) {
  const [expanded, setExpanded] = useState(false);
  const [desHtml, setDesHtml] = useState('');
  const { t, locale } = useLocaleContext();
  const { palette } = useTheme();
  const hasAttachment = useMemo(() => {
    const { attachments } = notification || {};
    if (!attachments) {
      return false;
    }
    try {
      return attachments.length > 0;
    } catch (error) {
      return false;
    }
  }, [notification]);

  const hasBlocks = useMemo(() => {
    const { blocks } = notification || {};
    if (!blocks) {
      return false;
    }
    try {
      return blocks.length > 0;
    } catch (error) {
      return false;
    }
  }, [notification]);

  const hasDescription = useMemo(() => {
    const { description } = notification || {};
    return !!description;
  }, [notification]);

  const hasData = useMemo(() => {
    const { data } = notification || {};
    return !isEmpty(data);
  }, [notification]);

  const hasContent = useMemo(() => {
    return hasAttachment || hasBlocks || hasDescription || hasData;
  }, [hasAttachment, hasBlocks, hasDescription, hasData]);

  useEffect(() => {
    toClickableSpan(notification?.description ?? '', locale).then((body) => {
      setDesHtml(body);
    });
  }, [notification?.description, locale]);

  if (!hasContent) {
    return null;
  }

  const expandHtml = () => {
    if (rows === 0) {
      return '';
    }
    if (expanded) {
      return `<span class='toggle-btn' data-name='toggle-expanded'>${t('common.collapse')}</span>`;
    }
    return `...<span class='toggle-btn' data-name='toggle-expanded'>${t('common.expand')}</span>`;
  };

  const toggleExpanded = (e) => {
    const { target } = e;
    if (target.getAttribute('data-name') === 'toggle-expanded') {
      setExpanded(!expanded);
      e.customPreventRedirect = true;
    }
  };

  return (
    <TextWrapper color={minimal ? palette.common.white : ''}>
      <Box className="text-container" component="div" onClick={toggleExpanded}>
        {desHtml &&
          (!expanded && rows > 0 ? (
            <HTMLEllipsis
              innerRef={() => {}}
              onReflow={() => {}}
              basedOn="letters"
              component="article"
              unsafeHTML={sanitize(desHtml)}
              maxLine={rows}
              ellipsisHTML={sanitize(expandHtml())}
            />
          ) : (
            <MTypography
              component="div"
              className={`content ${rows === 0 ? 'ellipsis' : ''}`}
              style={{ whiteSpace: 'pre-line!important' }}
              dangerouslySetInnerHTML={{
                __html: sanitize(`${desHtml}${expandHtml()}`),
              }}
            />
          ))}
      </Box>
      {!minimal && (hasAttachment || hasData) ? (
        <NotificationPreviewPage severity={notification.severity} notification={notification} />
      ) : null}
    </TextWrapper>
  );
}

const TextWrapper = styled(Box)`
  width: 100%;
  color: ${(props) => (props.color ? props.color : props.theme.palette.text.secondary)};
  .text-container {
    word-wrap: break-word;
    word-break: break-all;
    color: ${(props) => (props.color ? props.color : props.theme.palette.text.secondary)};
    .toggle-btn {
      display: inline-block;
      white-space: nowrap;
      cursor: pointer;
      margin-left: 4px;
      color: ${(props) => props.theme.palette.secondary.main};
    }
    .content.ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-all;
      display: block;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-height: 1.25;
    }
  }
`;

export default memo(NotificationContent);
