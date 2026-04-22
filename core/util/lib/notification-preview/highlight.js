const getExplorerUrl = require('./explorer-url');
const { isSameAddr } = require('./func');

class Link {
  constructor({ type, did, chainId, text }) {
    this.text = text;
    this.did = did;
    this.type = type;
    this.chainId = chainId;
  }
}

const toTextList = (str) => {
  const arr = [];
  try {
    let startPoint = 0;
    const pattern = /<(.+?)\(?[tx|nft|token|stake|did|dapp|link]+[:](.+?)\)?>/gi; // matches <asdad(did:abt:xxx)>
    const matches = str.matchAll(pattern);

    for (const match of matches) {
      const didPattern = /\([tx|nft|token|stake|did|dapp|link]+[:](.+?)\)/gi; // matches (did:abt:xxx)

      const oriHit = match[0];
      const matchIndex = match.index || startPoint;
      const endPoint = matchIndex + oriHit.length;

      const didMatcherLength = oriHit.matchAll(didPattern);
      if ([...didMatcherLength].length > 1) {
        return [str];
      }

      let showName = '';
      const didMatcher = didPattern.exec(oriHit);
      let hit = '';
      if (didMatcher) {
        const didGroup = didMatcher[0];
        showName = oriHit.replace(didGroup, '').replace(/^</, '').replace(/(>)$/, '');
        hit = didGroup.replace(/\)$/, '').replace(/^\(/, '');
      } else {
        hit = oriHit;
      }

      const address = hit.split(':');
      const didType = (address[0] || '').replace(/^</, '').replace(/^\(/, '').toUpperCase();
      const chainId = (address[1] || '').replace(/>$/, '').replace(/\)$/, '');
      const did = (address[address.length - 1] || '').replace(/>$/, '').replace(/\)$/, '');

      arr.push(str.substring(startPoint, matchIndex));

      arr.push(
        new Link({
          type: didType,
          chainId,
          did,
          text: showName || didType,
        })
      );

      startPoint = endPoint;
    }

    if (startPoint < str.length) {
      arr.push(str.substring(startPoint));
    }

    return arr;
  } catch (error) {
    console.error(error?.message);
    return [str];
  }
};

const getLink = (item) => {
  let url;
  const { type, chainId, did } = item;
  if (isSameAddr(type, 'link')) {
    url = `${chainId}:${did}`;
  } else if (isSameAddr(type, 'tx')) {
    url = getExplorerUrl({ hash: did, chainId });
  } else if (isSameAddr(type, 'stake')) {
    url = getExplorerUrl({ stake: did, chainId });
  } else if (isSameAddr(type, 'nft')) {
    url = getExplorerUrl({ asset: did, chainId });
  } else if (isSameAddr(type, 'token')) {
    url = getExplorerUrl({ token: did, chainId });
  } else if (isSameAddr(type, 'did')) {
    url = getExplorerUrl({ address: did, chainId });
  }
  return url;
};

const toClickableSpan = (str, isHighLight = true) => {
  const textList = toTextList(str);
  return textList
    .map((item) => {
      if (item instanceof Link) {
        if (isHighLight) {
          const url = getLink(item);
          const { type, chainId, did } = item;

          // HACK: dapp display is not supported in email (no dapp link available), so render as bold only
          if (isSameAddr(type, 'dapp')) {
            return `<em style="font-weight:bold;" data-type="${type}" data-chain-id="${chainId}" data-did="${did}">${item.text}</em>`;
          }
          if (url) {
            return `<a target="_blank" rel="noopener noreferrer" style="color:#4598fa;font-weight:bold;" href="${url}">${item.text}</a>`;
          }

          // default: render as bold
          return `<em style="font-weight:bold;" data-type="${type}" data-chain-id="${chainId}" data-did="${did}">${item.text}</em>`;
        }
        return item.text;
      }

      return item;
    })
    .join('');
};

/**
 * Render message content with links for Slack
 * @param {*} str
 * @returns
 */
const toSlackLink = (str) => {
  const textList = toTextList(str);
  return textList
    .map((item) => {
      if (item instanceof Link) {
        return `<${getLink(item)}|${item.text}>`;
      }
      // HACK: remove :\n newlines from string content
      return item.replace(/:\n/g, ': ');
    })
    .join('');
};

module.exports = { toClickableSpan, toTextList, toSlackLink, Link, getLink };
