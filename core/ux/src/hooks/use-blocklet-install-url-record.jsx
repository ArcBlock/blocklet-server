/**
 * Install blocklet from URL
 * URL Records hook
 * 记录最新输入的URL，并记录在 localStorage 中
 * @return
 *   addUrlRecord:(url)=>void 保存一个URL到 localStorage
 *   removeUrlRecord:(url)=>void 从 localStorage 中移除 一个URL
 *   urls: url records max(10)
 */
import useLocalStorage from 'react-use/lib/useLocalStorage';

export const INSTALL_BLOCKLET_FROM_URL_KEY = 'install-blocklet-from-URL';

export const useBlockletInstallUrlRecord = () => {
  const [value, setValue] = useLocalStorage(INSTALL_BLOCKLET_FROM_URL_KEY, '[]', {
    raw: true,
  });

  const addUrlRecord = (url) => {
    const inputUrl = url.trim();
    const urls = JSON.parse(value);
    const recordIndex = urls.findIndex((u) => u === inputUrl);
    // 如果新添加的 URL 在第一位，则不需要做任何处理
    if (recordIndex === 0) return;
    // 如果新添加的 URL 不在第一位，需要重新排序到第一位
    if (recordIndex > 0) {
      urls.splice(recordIndex, 1);
    }
    // 如果已经存储了10条，则删除最后一条
    if (urls.length >= 10) {
      urls.splice(9);
    }
    urls.unshift(inputUrl);
    setValue(JSON.stringify(urls));
  };

  const removeUrlRecord = (url) => {
    if (!url) return;
    const urls = JSON.parse(value);
    const inputUrl = url.trim();
    const recordIndex = urls.findIndex((u) => u === inputUrl);
    if (recordIndex > -1) {
      urls.splice(recordIndex, 1);
      setValue(JSON.stringify(urls));
    }
  };

  return {
    urls: !value ? [] : JSON.parse(value),
    addUrlRecord,
    removeUrlRecord,
  };
};
