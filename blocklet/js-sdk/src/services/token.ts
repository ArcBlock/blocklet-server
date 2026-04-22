import Cookie from 'js-cookie';
import { SESSION_TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '@abtnode/constant';

export class TokenService {
  getSessionToken(config: any) {
    if (Cookie.get(SESSION_TOKEN_STORAGE_KEY)) {
      return Cookie.get(SESSION_TOKEN_STORAGE_KEY);
    }

    if (config.sessionTokenKey) {
      return window.localStorage.getItem(config.sessionTokenKey);
    }

    return '';
  }

  setSessionToken(value: string) {
    Cookie.set(SESSION_TOKEN_STORAGE_KEY, value);
  }

  removeSessionToken() {
    Cookie.remove(SESSION_TOKEN_STORAGE_KEY);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  setRefreshToken(value: string) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, value);
  }

  removeRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}
