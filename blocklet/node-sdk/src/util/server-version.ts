import { APP_CONFIG_FILE_PATH } from '@blocklet/constant';
import semver from 'semver';
import path from 'path';
import fs from 'fs';

let serverVersionFromDisk = '';
const appDataDir = process.env.BLOCKLET_APP_DATA_DIR;
if (appDataDir) {
  try {
    const configFile = path.join(appDataDir, APP_CONFIG_FILE_PATH);
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile).toString());
      serverVersionFromDisk = config.env.serverVersion;
    }
  } catch (error) {
    console.error(error);
  }
}

class ServerVersion {
  public version: string;

  constructor() {
    this.version = serverVersionFromDisk || process.env.ABT_NODE_VERSION || process.env.ABT_NODE || '0.0.0';
  }

  public gte(version) {
    return semver.gte(this.version, version);
  }

  public gt(version) {
    return semver.gt(this.version, version);
  }

  public lte(version) {
    return semver.lte(this.version, version);
  }

  public lt(version) {
    return semver.lt(this.version, version);
  }
}

const serverVersion = new ServerVersion();

export default serverVersion;
