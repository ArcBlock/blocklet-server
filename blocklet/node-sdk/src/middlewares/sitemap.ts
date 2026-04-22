// eslint-disable-next-line import/no-extraneous-dependencies
import { Request, Response } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { getStatusFromError } from '@blocklet/error';

import { env } from '../config';

type Image = {
  url: string;
  caption: string;
  title: string;
  geoLocation: string;
  license: string;
};

type Video = {
  thumbnail_loc: string;
  title: string;
  description: string;
  player_loc?: string;
  'player_loc:autoplay'?: string;
  'player_loc:allow_embed'?: string;
};

type Link = {
  lang: string;
  url: string;
};

type Publication = {
  name: string;
  language: string;
};

type News = {
  publication: Publication;
  genres: string;
  publication_date: string;
  title: string;
  keywords: string;
  stock_tickers: string;
};

type SitemapItem = {
  url: string;
  img?: Image[];
  video?: Video[];
  links?: Link[];
  androidLink?: string;
  news?: News;
};

type GeneratorFn = (fn: (item: SitemapItem) => void, req?: Request) => Promise<void>;

const sitemap = (generatorFn: GeneratorFn) => {
  return async (req: Request, res: Response) => {
    res.header('Content-Type', 'application/xml');
    try {
      const stream = new SitemapStream({ hostname: env.appUrl });
      await generatorFn(stream.write.bind(stream), req);
      stream.end();
      const result = await streamToPromise(stream).then((data) => data.toString());
      res.send(result);
    } catch (err) {
      console.error('Failed to generate sitemap', err);
      res.status(getStatusFromError(err)).send(err.message);
    }
  };
};

export { sitemap };
