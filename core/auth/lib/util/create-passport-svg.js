const { getNftBGColor, DEFAULT_COLORS, getNftBGColorFromDid, getSvg } = require('@arcblock/nft-display');

const getPassportColor = (preferredColor, did) => {
  let color;
  if (preferredColor === 'default') {
    color = DEFAULT_COLORS['app-passport'];
  } else if (preferredColor === 'auto') {
    color = getNftBGColorFromDid(did);
  } else {
    color = getNftBGColor(preferredColor);
  }

  return color;
};

const getTextColor = (background) => {
  const r = parseInt(background.slice(1, 3), 16);
  const g = parseInt(background.slice(3, 5), 16);
  const b = parseInt(background.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111' : '#EEE';
};

/**
 * Generate Passport SVG
 *
 * @param {object} params
 * @param {string} params.title passport title
 * @param {string} params.issuer issuer name
 * @param {string} params.issuerDid
 * @param {string} [params.ownerName]
 * @param {string} params.ownerDid
 * @param {string} params.ownerAvatarUrl
 * @param {string} [params.preferredColor]
 * @param {string} [params.width]
 * @param {string} [params.height]
 * @param {string} [params.ownerAvatarUrl]
 * @param {string} [params.issuerAvatarUrl]
 * @param {boolean} [params.revoked] 是否撤销
 * @param {boolean} [params.isDataUrl] 返回生成 data url
 * @param {object} [params.extra]
 * @param {string} [params.scope]
 * @param {string} [params.role]
 * @returns {string} svg xml or image data url
 */
const createPassportSvg = ({
  issuer = '',
  title = '',
  issuerDid = '',
  issuerAvatarUrl = '',
  ownerDid = '',
  ownerName = '',
  ownerAvatarUrl = '',
  preferredColor = 'default',
  revoked = false,
  isDataUrl = false,
  width = '100%',
  height = '100%',
  extra = null,
  scope = 'passport',
  role = '',
}) => {
  const color = getPassportColor(preferredColor, issuerDid);

  const svgXML = getSvg({
    width,
    height,

    tag: revoked ? 'revoked' : '',
    tagVariant: revoked ? 'error' : 'info',

    color,

    did: ownerDid,
    variant: `app-${scope}`,
    verifiable: true,

    issuer: {
      name: issuer,
      icon: issuerAvatarUrl,
    },

    header: {
      name: scope === 'passport' ? title : ownerName,
      icon: ownerAvatarUrl,
    },

    extra: scope === 'kyc' ? { key: role, value: title } : extra || { key: 'Exp', value: '2123-01-01' },
  });

  if (isDataUrl) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgXML)}`;
  }

  return svgXML;
};

module.exports = createPassportSvg;
module.exports.getPassportColor = getPassportColor;
module.exports.getTextColor = getTextColor;
