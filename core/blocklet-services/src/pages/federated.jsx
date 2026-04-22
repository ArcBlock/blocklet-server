export default function Federated() {
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode') || 'logout';
  const refreshTokenKey = 'refresh_token';

  // TODO: 改为 postMessage 来通信
  if (mode === 'login') {
    const refreshToken = searchParams.get('refreshToken');
    localStorage.setItem(refreshTokenKey, refreshToken);
  } else if (mode === 'logout') {
    localStorage.removeItem(refreshTokenKey);
  }
  if (window.self !== window.top) {
    const keepWindow = !!searchParams.get('keepWindow');
    if (!keepWindow) {
      window.close();
    }
  }
  return null;
}
