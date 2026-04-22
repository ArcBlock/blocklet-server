/* eslint-disable import/prefer-default-export */
import Toast from '@arcblock/ux/lib/Toast';

export const echoError = async (fn, defaultMessage = 'Failed to saved') => {
  try {
    await fn();
  } catch (error) {
    Toast.error(error?.message || defaultMessage);
  }
};
