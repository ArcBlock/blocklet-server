import { userMiddleware as user } from './user';
import { authMiddleware as auth } from './auth';
import component from './component';
import { fallback } from './fallback';
import { sitemap } from './sitemap';
import { sessionMiddleware as session } from './session';
import { csrf } from './csrf';
import { cdn } from './cdn';

export { user, auth, component, fallback, sitemap, csrf, session };

export default {
  user,
  auth,
  component,
  fallback,
  sitemap,
  csrf,
  session,
  cdn,
};
