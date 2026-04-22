import axios from '@abtnode/util/lib/axios';
import { isValid, toTypeInfo, types } from '@arcblock/did';
import { checkFreeBlocklet } from '@blocklet/meta/lib/payment/v2';
import { isFreeBlocklet } from '@blocklet/meta/lib/util';
import { getBlockletMetaFromUrls, getSourceUrlsFromConfig } from '@blocklet/meta/lib/util-meta';
import { fromSecretKey } from '@ocap/wallet';
import FormData from 'form-data';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import get from 'lodash/get';
import pAll from 'p-all';
import path from 'path';
import { joinURL } from 'ufo';

import { createRelease } from '@abtnode/util/lib/create-blocklet-release';
import { baseWrapSpinner } from './utils/base-wrap-spinner';
import { Share, ensureBlockletNftFactory, getShare } from './utils/get-payment-share';
import { replaceOrigin } from './utils/replace-origin';
import { BlockletMeta, sign } from './utils/sign';
import { verifyBundleSize } from './utils/verify-bundle-size';

export interface UploadOptions {
  storeUrl: string;
  accessToken: string;
  developerDid: string;
  possibleSameStore?: boolean;
  metaFile: string;
  source: string;
  wrapSpinner?: typeof baseWrapSpinner;
  printSuccess: (...args: unknown[]) => void;
  printTar: (meta: unknown, metaPath: string) => Promise<void>;
  debug: (...args: unknown[]) => void;
}

interface Source {
  name?: string;
  store?: string;
  version?: string;
  url?: string;
}

export async function upload({
  storeUrl,
  accessToken,
  developerDid,
  metaFile,
  source,
  possibleSameStore,
  wrapSpinner = baseWrapSpinner,
  printSuccess = () => {},
  printTar = async () => {},
  debug = () => {},
}: UploadOptions): Promise<BlockletMeta | undefined> {
  if (!fs.existsSync(metaFile)) {
    throw new Error(`Invalid release meta file ${metaFile} not exists`);
  }
  const meta = fs.readJSONSync(metaFile);
  const releaseReleaseDir = path.resolve(metaFile, '..', '..', 'bundle');
  if (possibleSameStore && meta.components) {
    const parseSource = async (component: { name: string; source?: Source }) => {
      try {
        const nextComponent = { ...component };
        if (nextComponent.source) {
          nextComponent.source = { ...nextComponent.source };
          if (nextComponent.source.url) {
            nextComponent.source.url = replaceOrigin(nextComponent.source.url, storeUrl);
            const res = await axios.get(nextComponent.source.url);
            return res?.data?.did ? nextComponent : component;
          }
          nextComponent.source.store = storeUrl;
        } else {
          nextComponent.source = { name: component.name, store: storeUrl, version: 'latest' };
        }
        const urls = getSourceUrlsFromConfig(nextComponent);
        await getBlockletMetaFromUrls(urls, {
          returnUrl: false,
          validateFn: () => true,
          ensureTarball: false,
        });
        return nextComponent;
      } catch (err) {
        // console.error(`Failed to get meta ${component.name} from ${storeUrl}`, err);
        return component;
      }
    };
    const events = meta.components.map((component: { name: string; source?: Source }) => {
      return () => parseSource(component);
    });
    meta.components = await pAll(events, { concurrency: 4 });

    // update yaml
    const yamlFile = path.join(releaseReleaseDir, 'blocklet.yml');
    const metaYaml = yaml.load(fs.readFileSync(yamlFile).toString(), { json: true }) as Record<string, unknown>;
    metaYaml.components = meta.components;
    if (meta.engine && meta.engine?.source?.store) {
      meta.engine = await parseSource({ ...meta.engine });
      metaYaml.engine = meta.engine;
    }
    fs.writeFileSync(yamlFile, yaml.dump(metaYaml, { sortKeys: false, skipInvalid: true }));

    // create release
    const dir = path.resolve(metaFile, '..', '..');
    const release = await createRelease(dir, {
      printError: (err: Error) => {
        throw err;
      },
      printInfo: () => {},
      tarball: meta.dist.tarball,
    });

    meta.dist.integrity = release.meta.dist.integrity;
    meta.dist.size = release.meta.dist.size;
  }
  // convert meta.charging -> meta.payment
  if (meta.payment === undefined) {
    const { charging } = meta;
    const payment = {} as Record<string, unknown>;
    if (charging && Array.isArray(charging.tokens)) {
      payment.price = charging.tokens.map((x: Share) => ({
        address: x.address,
        value: x.price,
      }));
    }
    if (charging && Array.isArray(charging.shares)) {
      payment.share = charging.shares.map((x: Share) => ({
        name: x.name,
        address: x.address,
        value: x.share,
      }));
    }
    meta.payment = payment;
    delete meta.charging;
  }

  const { tarball } = meta.dist;
  const tarballFilePath = path.join(path.dirname(metaFile), tarball);
  await verifyBundleSize({ storeUrl, tarballFilePath });

  const wallet = fromSecretKey(accessToken);

  if (!wallet) {
    throw new Error(
      `[NO-ACCESS] Blocklet store accessToken is used to authorize developers when uploading blocklets, you can generate your own accessToken from ${storeUrl}`,
    );
  }

  if (isFreeBlocklet(meta) === false) {
    // check for developer did
    if (!developerDid || isValid(developerDid) === false) {
      throw new Error(
        `developerDid is required to upload a paid blocklet, please get your developerDid from ${storeUrl}`,
      );
    }

    // create nft factory address if the blocklet requires payment
    try {
      const typeInfo = toTypeInfo(meta.did);
      const isNewDid = typeInfo.role === types.RoleType.ROLE_BLOCKLET;
      // new did mode: share payment to blocklet-did
      // old did mode: share payment to developer-did
      meta.payment.share = await getShare({ meta, storeUrl, developerDid: isNewDid ? meta.did : developerDid });
      const nftFactory = await ensureBlockletNftFactory({ meta, storeUrl });
      meta.nftFactory = nftFactory;
      printSuccess(`NFT Factory for ${meta.name}: ${nftFactory}`);
    } catch (err) {
      throw new Error(`Can not determine NFT factory for ${meta.name}: ${err.message}`);
    }
  } else {
    await checkFreeBlocklet(meta);
  }

  const signature = await sign(meta, wallet);
  meta.signatures = [signature];

  printSuccess('Blocklet release signed successfully, signature:', signature.sig);

  await printTar(meta, tarballFilePath);

  const data = new FormData();
  data.append('blocklet-meta', Buffer.from(JSON.stringify(meta)), { filename: path.basename(metaFile) });
  data.append('blocklet-tarball', fs.readFileSync(tarballFilePath), { filename: path.basename(tarballFilePath) });
  data.append('source', source);

  let uploadResult: { data?: { status: string } } = {};
  try {
    await wrapSpinner(`Uploading ${meta.name}@${meta.version}...`, async () => {
      uploadResult = await axios({
        url: joinURL(storeUrl, '/api/blocklets/upload'),
        method: 'POST',
        data,
        headers: {
          ...data.getHeaders(),
          'blocklet-version': meta.version,
          'blocklet-did': meta.did,
        },
        timeout: 30 * 60 * 1000, // 30 minutes
        maxContentLength: Number.POSITIVE_INFINITY,
        maxBodyLength: Number.POSITIVE_INFINITY,
      });
    });
    debug('Upload result:', uploadResult.data);
  } catch (err) {
    if (err.response) {
      const errorMessage = get(err.response, 'data.error', err.response.statusText);
      throw new Error(`Upload failed with error: [${err.response.status}] \n${errorMessage}\n`);
    }

    throw new Error(`Upload failed with error: ${err.message}`);
  }

  return { ...meta, status: uploadResult.data?.status || '' };
}
