function getYoutubeId(link: string) {
  const url = link.trim();
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0];
  }

  if (url.includes('/embed/')) {
    return url.split('/embed/')[1]?.split('?')[0];
  }

  if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  }
  if (url.includes('youtube.com/shorts/')) {
    return url.split('/shorts/')[1]?.split('?')[0];
  }
  return '';
}

function getVimeoId(link: string) {
  const url = link.trim();
  if (url.includes('/embed/')) {
    return url.split('/embed/')[1]?.split('?')[0];
  }

  if (url.includes('vimeo.com/video/')) {
    return url.split('/video/')[1]?.split('?')[0];
  }

  // Check for Vimeo channel URL format
  if (url.includes('vimeo.com/channels/')) {
    return url.split('/channels/')[1]?.split('/')[1]?.split('?')[0];
  }

  // Check for Vimeo group URL format
  if (url.includes('vimeo.com/groups/')) {
    return url.split('/groups/')[1]?.split('/')[1]?.split('?')[0];
  }

  // Check for Vimeo short URL format
  if (url.includes('vimeo.com/')) {
    return url.split('vimeo.com/')[1]?.split('?')[0];
  }
  return '';
}

const cacheVideoId = {};
function getVideoId(link: string) {
  const url = link.trim();
  if (!url || !/^https?:\/\/.+\..+/.test(url)) return [];
  if (cacheVideoId[url]) return cacheVideoId[url];

  cacheVideoId[url] = (() => {
    const urlObj = new URL(url);
    if (urlObj.host.includes('youtube.com') || urlObj.host.includes('youtu.be')) {
      return [getYoutubeId(url), 'youtube'];
    }
    if (urlObj.host.includes('vimeo.com')) {
      return [getVimeoId(url), 'vimeo'];
    }
    return [];
  })();

  return cacheVideoId[url];
}

const cacheEmbedUrl = {};
function getEmbedUrl(link: string, { modestbranding = 1, controls = 0, autoplay = 0 } = {}) {
  const url = link.trim();
  if (!url) return '';
  if (cacheEmbedUrl[url] !== undefined) return cacheEmbedUrl[url];
  const [id, platform] = getVideoId(url);
  if (platform === 'youtube') {
    cacheEmbedUrl[url] =
      `https://www.youtube.com/embed/${id}?modestbranding=${modestbranding}&controls=${controls}&autoplay=${autoplay}`;
  } else if (platform === 'vimeo') {
    cacheEmbedUrl[url] = `https://player.vimeo.com/video/${id}?autoplay=${autoplay}`;
  } else {
    cacheEmbedUrl[url] = '';
  }
  return cacheEmbedUrl[url];
}

const cacheCoverUrl = {};
function getVideoCoverUrl(link: string) {
  const url = link.trim();
  if (!url) return '';
  if (cacheCoverUrl[url] !== undefined) return cacheCoverUrl[url];
  const [id, platform] = getVideoId(url);
  if (platform === 'youtube') {
    cacheCoverUrl[url] = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  } else if (platform === 'vimeo') {
    cacheCoverUrl[url] = `https://i.vimeocdn.com/${id}/1000x563`;
  } else {
    cacheCoverUrl[url] = '';
  }
  return cacheCoverUrl[url];
}

function getVideoCheckUrl(link: string) {
  const url = link.trim();
  if (!url) return '';
  const [id, platform] = getVideoId(url);
  if (platform === 'youtube') {
    return `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  }
  if (platform === 'vimeo') {
    return `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`;
  }
  return '';
}

function isVideoUrl(link: string) {
  const url = link.trim();
  return getVideoId(url).length > 0;
}

export { getVideoId, getEmbedUrl, getVideoCoverUrl, getVideoCheckUrl, getYoutubeId, getVimeoId, isVideoUrl };
