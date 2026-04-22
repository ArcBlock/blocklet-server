import { withLeadingSlash, withTrailingSlash } from 'ufo';

export class AssetHostTransformer {
  private static readonly HTML_TAG_INDICATOR = '<html';

  private readonly assetBase: string;

  private readonly quotedAssetBasePattern: RegExp;

  constructor(assetBase: string) {
    this.assetBase = withLeadingSlash(withTrailingSlash(assetBase));
    this.quotedAssetBasePattern = new RegExp(AssetHostTransformer.escapeForRegex(`"${this.assetBase}`), 'g');
  }

  private static escapeForRegex(value: string) {
    const pattern = /[.*+?^${}()|[\]\\]/g;
    return value.replace(pattern, '\\$&');
  }

  private static normalizeAssetHost(assetHost: string | null) {
    if (!assetHost) {
      return null;
    }

    const trimmed = assetHost.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed.replace(/\/+$/, '').replace(/^https?:\/\//, '');
  }

  static containsHtmlMarkup(payload: string) {
    return payload.includes(AssetHostTransformer.HTML_TAG_INDICATOR);
  }

  transform(html: string, assetHost: string) {
    const host = AssetHostTransformer.normalizeAssetHost(assetHost);
    if (!host) {
      return html;
    }

    if (!AssetHostTransformer.containsHtmlMarkup(html)) {
      return html;
    }

    return html.replace(this.quotedAssetBasePattern, `"//${host}${this.assetBase}`);
  }

  transformBuffer(body: Buffer, assetHost: string) {
    const bodyAsString = body.toString('utf8');

    if (!AssetHostTransformer.containsHtmlMarkup(bodyAsString)) {
      return body;
    }

    const transformed = this.transform(bodyAsString, assetHost);
    if (transformed === bodyAsString) {
      return body;
    }

    return Buffer.from(transformed);
  }
}
