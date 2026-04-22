import { getSafeUrl } from '@arcblock/ux/lib/Util/security';
import Toast from '@arcblock/ux/lib/Toast';

export default function getSafeUrlWithToast(...args) {
  try {
    return getSafeUrl(...args);
  } catch (error) {
    Toast.error('Invalid redirect url');
    console.error('Invalid redirect url', error);
    throw error;
  }
}
