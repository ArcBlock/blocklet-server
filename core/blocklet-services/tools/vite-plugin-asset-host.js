export default function assetCdnHostPlugin() {
  return {
    name: 'blocklet-services:asset-cdn-host',
    transformIndexHtml(html, ctx) {
      if (ctx.bundle) {
        const dynamicBaseAssetsCode = `window.__toCdnUrl = filePath => {
          const assetBase = '/.well-known/service/static/';
          return window.blocklet.ASSET_CDN_HOST ? '//' + window.blocklet.ASSET_CDN_HOST + assetBase + filePath : assetBase + filePath;
        }`;
        return [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: dynamicBaseAssetsCode,
          },
        ];
      }
      return html;
    },
    config(config, { command }) {
      if (command === 'build') {
        if (!config.experimental?.renderBuiltUrl) {
          return {
            experimental: {
              renderBuiltUrl: (filename, { hostType }) => {
                if (hostType === 'js') {
                  return { runtime: `window.__toCdnUrl(${JSON.stringify(filename)})` };
                }
                return undefined;
              },
            },
          };
        }
      }

      return {};
    },
  };
}
