import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useState, useRef, useCallback, useEffect } from 'react';
import { CircularProgress, Box, useTheme } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import pick from 'lodash/pick';
import { useNodeContext } from '../contexts/node';
import { useBlockletContext } from '../contexts/blocklet';
import useMobile from '../../lib/hooks/use-mobile';

export default function BlockletAppearance() {
  const { info, inService } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { locale } = useLocaleContext();
  const topRef = useRef(null);
  const theme = useTheme();
  const [height, setHeight] = useState(0);
  const isMobile = useMobile();
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  let pathPrefix = '';
  if (inService) {
    pathPrefix = WELLKNOWN_SERVICE_PATH_PREFIX;
  } else if (process.env.NODE_ENV === 'production') {
    pathPrefix = info.routing.adminPath;
  }

  const urlSearchParams = new URLSearchParams();
  if (!inService) {
    urlSearchParams.set('authKey', '__sst');
  } else {
    // 支持 themeBuilder 预览真实的 App 页面
    urlSearchParams.set('appUrl', window.location.origin);
  }
  urlSearchParams.set(
    'schemaKey',
    joinURL(window.location.origin, pathPrefix, `/api/theme?id=${encodeURIComponent(blocklet.meta.did)}`)
  );

  const sendThemeData = useCallback(() => {
    if (iframeRef.current) {
      const blockletTheme = pick(JSON.parse(JSON.stringify(theme)), [
        'palette',
        'typography',
        'shape',
        'direction',
        'breakpoints',
        'mixins',
        'shadows',
        'transitions',
        'zIndex',
      ]);

      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SEND_THEME',
          payload: blockletTheme,
        },
        window.location.origin
      );
    }
  }, [theme]);

  const sendLocale = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SEND_LOCALE',
          payload: locale,
        },
        window.location.origin
      );
    }
  }, [locale]);

  // 监听来自 iframe 的消息
  useEffect(() => {
    const handleMessage = (event) => {
      // 验证消息来源
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'REQUEST_THEME') {
        sendThemeData();
      }

      if (event.data.type === 'THEME_BUILDER_LOADED') {
        sendLocale();
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [sendThemeData, sendLocale]);

  // theme 可能发生改变
  useEffect(() => {
    if (isLoading === false) {
      sendThemeData();
    }
  }, [theme, isLoading, sendThemeData]);

  // locale 可能发生改变
  useEffect(() => {
    if (isLoading === false) {
      sendLocale();
    }
  }, [locale, isLoading, sendLocale]);

  // 计算 iframe 高度
  useEffect(() => {
    const main = document.querySelector('#arc__dashboard-main');
    const content = document.querySelector('.dashboard-content');

    const calcHeight = () => {
      if (topRef.current) {
        const { height: containerH } = main.getBoundingClientRect();
        const { top: contentTop } = content.getBoundingClientRect();
        const { top } = topRef.current.getBoundingClientRect();
        let result = containerH - top + contentTop - (isMobile ? 108 : 164);

        // 移动端高度太低很难使用
        if (isMobile) {
          result = Math.min(result, 600);
        }
        setHeight(result);
      }
    };
    calcHeight();

    window.addEventListener('resize', calcHeight);
    return () => {
      window.removeEventListener('resize', calcHeight);
    };
  }, [isMobile, theme]);

  return (
    <>
      <Box ref={topRef} />
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '500px',
          }}>
          <CircularProgress />
        </Box>
      )}
      <iframe
        title="Theme Builder"
        ref={iframeRef}
        src={`${joinURL(window.location.origin, pathPrefix, '/hosted/theme-builder/')}?${urlSearchParams.toString()}`}
        style={{
          border: 0,
          width: '100%',
          height: `${height}px`,
          display: isLoading ? 'none' : 'block',
        }}
      />
    </>
  );
}
