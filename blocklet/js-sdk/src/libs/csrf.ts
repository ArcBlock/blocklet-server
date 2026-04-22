import axios from 'axios';
import Cookie from 'js-cookie';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

export function getCSRFToken() {
  return Cookie.get('x-csrf-token');
}

export function getLoginToken() {
  return Cookie.get('login_token');
}

export async function getCSRFTokenByLoginToken(): Promise<{ loginToken: string; csrfToken: string | null }> {
  const csrfToken = getCSRFToken();
  try {
    const url: string = joinURL(window.location.origin, WELLKNOWN_SERVICE_PATH_PREFIX, '/api/did/csrfToken');
    const { data } = await axios.get(url, {
      headers: {
        'x-csrf-token': csrfToken,
      },
    });

    return data;
  } catch (error) {
    console.error(error);
    return {
      loginToken: getLoginToken(),
      csrfToken: null,
    };
  }
}
