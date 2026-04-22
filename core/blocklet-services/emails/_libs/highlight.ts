import getExplorerUrl from './explorer-url';
import { isSameAddr } from './func';

class Link {
  text: string;
  did: string;
  type: string;
  chainId: string;

  constructor({ type, did, chainId, text }: { type: string; did: string; chainId: string; text: string }) {
    this.text = text;
    this.did = did;
    this.type = type;
    this.chainId = chainId;
  }
}

const toClickableSpan = (str: string, isHighLight: boolean = true) => {
  const textList = toTextList(str);
  return textList
    .map((item) => {
      if (item instanceof Link) {
        if (isHighLight) {
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

          // HACK: 邮件中无法支持 dapp 的展示，缺少 dapp 链接，只能作为加粗展示
          if (isSameAddr(type, 'dapp')) {
            return `<em style="font-weight:bold;" data-type="${type}" data-chain-id="${chainId}" data-did="${did}">${item.text}</em>`;
          }
          if (url) {
            return `<a target="_blank" style="color:#4598fa;font-weight:bold;" href="${url}">${item.text}</a>`;
          }

          // 默认展示为加粗
          return `<em style="font-weight:bold;" data-type="${type}" data-chain-id="${chainId}" data-did="${did}">${item.text}</em>`;
        }
        return item.text;
      }

      return item;
    })
    .join('');
};

type TextItem = string | Link;

function toTextList(str: string) {
  const arr: TextItem[] = [];
  try {
    let startPoint = 0;
    const pattern = /<(.+?)\(?[tx|nft|token|stake|did|dapp|link]+[:](.+?)\)?>/gi; // 匹配 <asdad(did:abt:xxx)>
    const matches = str.matchAll(pattern);

    for (const match of matches) {
      const didPattern = /\([tx|nft|token|stake|did|dapp|link]+[:](.+?)\)/gi; // 匹配 (did:abt:xxx)

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
      const didType = (address[0] || '').replace(/^</, '').replace(/^\(/, '')?.toUpperCase();
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
}

export { toClickableSpan };
