import { describe, expect, it } from 'bun:test';
import { getVimeoId, getYoutubeId, getVideoId, getEmbedUrl, getVideoCheckUrl, getVideoCoverUrl } from '../src/video';

describe('video', () => {
  describe('getVimeoId', () => {
    it('should return the vimeo id from embed url', () => {
      expect(getVimeoId('https://player.vimeo.com/video/123456789')).toBe('123456789');
    });

    it('should return the vimeo id from channel url', () => {
      expect(getVimeoId('https://vimeo.com/channels/xxxx/123456789')).toBe('123456789');
    });

    it('should return the vimeo id from group url', () => {
      expect(getVimeoId('https://vimeo.com/groups/xxxx/123456789')).toBe('123456789');
    });

    it('should return the vimeo id from short url', () => {
      expect(getVimeoId('https://vimeo.com/123456789')).toBe('123456789');
    });

    it('should return empty string if the url is not a vimeo url', () => {
      expect(getVimeoId('https://www.google.com')).toBe('');
    });
  });

  describe('getYoutubeId', () => {
    it('should return the youtube id from embed url', () => {
      expect(getYoutubeId('https://www.youtube.com/embed/123456789')).toBe('123456789');
    });

    it('should return the youtube id from short url', () => {
      expect(getYoutubeId('https://www.youtube.com/shorts/123456789')).toBe('123456789');
    });

    it('should return the youtube id from watch url', () => {
      expect(getYoutubeId('https://www.youtube.com/watch?v=123456789')).toBe('123456789');
    });

    it('should return the youtube id from standard url', () => {
      expect(getYoutubeId('https://www.youtube.com/watch?v=123456789')).toBe('123456789');
    });

    it('should return empty string if the url is not a youtube url', () => {
      expect(getYoutubeId('https://www.google.com')).toBe('');
    });
  });

  describe('getVideoId', () => {
    it('should return the video id from vimeo url', () => {
      expect(getVideoId('https://vimeo.com/123456789')).toEqual(['123456789', 'vimeo']);
    });

    it('should return the video id from youtube url', () => {
      expect(getVideoId('https://www.youtube.com/watch?v=123456789')).toEqual(['123456789', 'youtube']);
    });

    it('should return empty array if the url is not a video url', () => {
      expect(getVideoId('https://www.google.com')).toEqual([]);
    });
  });

  describe('getEmbedUrl', () => {
    describe('vimeo', () => {
      it('should return the embed url from youtube url', () => {
        expect(getEmbedUrl('https://www.youtube.com/watch?v=123456789')).toBe(
          'https://www.youtube.com/embed/123456789?modestbranding=1&controls=0&autoplay=0'
        );
      });

      it('should return the embed url from short url', () => {
        expect(getEmbedUrl('https://www.youtube.com/shorts/123456789')).toBe(
          'https://www.youtube.com/embed/123456789?modestbranding=1&controls=0&autoplay=0'
        );
      });

      it('should return the embed url from standard url', () => {
        expect(getEmbedUrl('https://www.youtube.com/watch?v=123456789')).toBe(
          'https://www.youtube.com/embed/123456789?modestbranding=1&controls=0&autoplay=0'
        );
      });
    });

    describe('youtube', () => {
      it('should return the embed url from youtube url', () => {
        expect(getEmbedUrl('https://www.youtube.com/watch?v=123456789')).toBe(
          'https://www.youtube.com/embed/123456789?modestbranding=1&controls=0&autoplay=0'
        );
      });

      it('should return the embed url from short url', () => {
        expect(getEmbedUrl('https://www.youtube.com/shorts/123456789')).toBe(
          'https://www.youtube.com/embed/123456789?modestbranding=1&controls=0&autoplay=0'
        );
      });

      it('should return the embed url from standard url', () => {
        expect(getEmbedUrl('https://www.youtube.com/watch?v=123456789')).toBe(
          'https://www.youtube.com/embed/123456789?modestbranding=1&controls=0&autoplay=0'
        );
      });

      it('should return the embed url from youtube url', () => {
        expect(getEmbedUrl('https://www.youtube.com/watch?v=123456789')).toBe(
          'https://www.youtube.com/embed/123456789?modestbranding=1&controls=0&autoplay=0'
        );
      });
    });
  });

  describe('getVideoCheckUrl', () => {
    it('should return the video check url from vimeo url', () => {
      expect(getVideoCheckUrl('https://vimeo.com/123456789')).toBe(
        'https://vimeo.com/api/oembed.json?url=https://vimeo.com/123456789'
      );
    });

    it('should return the video check url from youtube url', () => {
      expect(getVideoCheckUrl('https://www.youtube.com/watch?v=123456789')).toBe(
        'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=123456789&format=json'
      );
    });

    it('should return empty string if the url is not a video url', () => {
      expect(getVideoCheckUrl('https://www.google.com')).toBe('');
    });
  });

  describe('getVideoCoverUrl', () => {
    it('should return the video cover url from vimeo url', () => {
      expect(getVideoCoverUrl('https://vimeo.com/123456789')).toBe('https://i.vimeocdn.com/123456789/1000x563');
    });

    it('should return the video cover url from youtube url', () => {
      expect(getVideoCoverUrl('https://www.youtube.com/watch?v=123456789')).toBe(
        'https://img.youtube.com/vi/123456789/mqdefault.jpg'
      );
    });

    it('should return empty string if the url is not a video url', () => {
      expect(getVideoCoverUrl('https://www.google.com')).toBe('');
    });
  });
});
