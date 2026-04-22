import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

export const isVideoUrl = (url) => {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  // 检查 URL 是否为 Vimeo 链接
  const isVimeo = url.includes('vimeo.com');
  return isYouTube || isVimeo;
};

function VideoEmbed({ url, style = {}, controls = 1, modestbranding = 1 }) {
  const { t } = useLocaleContext();
  // 检查 URL 是否为 YouTube 链接
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  // 检查 URL 是否为 Vimeo 链接
  const isVimeo = url.includes('vimeo.com');

  if (isYouTube) {
    // 解析 YouTube 视频 ID
    const youtubeId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          pointerEvents: style?.pointerEvents || 'auto',
        }}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?modestbranding=${modestbranding}&controls=${controls}&rel=0`}
          title="YouTube video player"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            ...style,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVimeo) {
    // 解析 Vimeo 视频 ID
    const vimeoId = url.split('/').pop();
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          pointerEvents: style.pointerEvents || 'auto',
        }}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Vimeo video player"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            ...style,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // 如果 URL 无效或不支持
  return (
    <Box style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen>
        <Icon icon="carbon:video-off" style={{ fontSize: 40, marginBottom: '10px', opacity: 0.5 }} />
        <Typography variant="body1" sx={{ opacity: 0.5 }}>
          {t('studio.videoDialogNoSrc')}
        </Typography>
      </Box>
    </Box>
  );
}

VideoEmbed.propTypes = {
  url: PropTypes.string.isRequired,
  style: PropTypes.object,
  controls: PropTypes.number,
  modestbranding: PropTypes.number,
};

export default VideoEmbed;
