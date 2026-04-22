import { describe, it, expect } from 'bun:test';
import { AssetHostTransformer } from '../../src/util/asset-host-transformer';

const TEST_DID = 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu';
const TEST_ASSET_BASE = `/.blocklet/proxy/${TEST_DID}/`;

describe('BlockletAssetHostTransformer', () => {
  it('should not modify HTML content when no asset host is provided', () => {
    const transformer = new AssetHostTransformer(TEST_ASSET_BASE);

    const htmlWithAsset = `<html><head><link href="/.blocklet/proxy/${TEST_DID}/styles.css" /></head></html>`;
    expect(transformer.transform(htmlWithAsset, '')).toBe(htmlWithAsset);
  });

  it('should transform Buffer objects containing HTML markup', () => {
    const transformer = new AssetHostTransformer(TEST_ASSET_BASE);

    const buffer = Buffer.from(
      `<!doctype html><html><head><link href="/.blocklet/proxy/${TEST_DID}/main.css" /></head></html>`
    );
    const result = transformer.transformBuffer(buffer, 'cdn.example.com');

    expect(result.toString()).toContain(`href="//cdn.example.com/.blocklet/proxy/${TEST_DID}/main.css"`);
  });

  it('should leave non-HTML Buffer objects unmodified', () => {
    const transformer = new AssetHostTransformer(TEST_ASSET_BASE);

    const buffer = Buffer.from('file content');
    expect(transformer.transformBuffer(buffer, 'cdn.example.com')).toBe(buffer);
  });

  it('should normalize asset host by removing trailing slashes and protocols', () => {
    const transformer = new AssetHostTransformer(TEST_ASSET_BASE);

    // Should transform if asset base is present and assetHost has trailing slash or protocol
    const htmlWithAsset = `<html><head><link href="/.blocklet/proxy/${TEST_DID}/styles.css" /></head></html>`;
    const expectedHref = `href="//cdn.example.com/.blocklet/proxy/${TEST_DID}/styles.css"`;

    expect(transformer.transform(htmlWithAsset, 'cdn.example.com/')).toContain(expectedHref);

    expect(transformer.transform(htmlWithAsset, 'https://cdn.example.com/')).toContain(expectedHref);

    expect(transformer.transform(htmlWithAsset, 'cdn.example.com')).toContain(expectedHref);
  });
});
