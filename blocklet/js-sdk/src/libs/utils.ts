import omit from 'lodash/omit';
import isObject from 'lodash/isObject';
import stableStringify from 'json-stable-stringify';
import Cookies from 'js-cookie';
import type { VerifyFn } from '../types';

export const sleep = (time = 0) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

export const getBearerToken = (token: string) => {
  return `Bearer ${encodeURIComponent(token)}`;
};

const visitorIdKey = 'vid';
const visitorIdKeyLegacy = '__visitor_id';

export const getVisitorId = () => {
  return Cookies.get(visitorIdKey) || localStorage.getItem(visitorIdKeyLegacy);
};

export const setVisitorId = (value: string | null) => {
  if (value === null) {
    localStorage.removeItem(visitorIdKey);
  } else {
    localStorage.setItem(visitorIdKey, value);
  }
};

export const verifyResponse = async (response: any, onInvalid: () => void, verifyFn?: VerifyFn) => {
  if (
    isObject(response.data) &&
    response.status >= 200 &&
    response.status < 300 &&
    typeof window !== 'undefined' &&
    window.blocklet?.appId &&
    window.blocklet?.appPk
  ) {
    // Skip verification when no verifyFn is provided
    if (!verifyFn) {
      return response;
    }

    if (!response.data.$signature) {
      onInvalid();
      throw new Error('Invalid response');
    }

    const { appId, appPk } = window.blocklet;
    const data = stableStringify(omit(response.data, ['$signature']));
    const result = await verifyFn(data, response.data.$signature, appPk, appId);

    if (result === false) {
      onInvalid();
      throw new Error('Invalid response');
    }
  }

  return response;
};
