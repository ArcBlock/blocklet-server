const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const shelljs = require('shelljs');
const yaml = require('js-yaml');
const { printError, printInfo, printWarning, printSuccess, print } = require('../../util');

exports.run = ({ setup }) => {
  if (!setup) {
    printError('Missing required --setup flag. Usage: blocklet router --setup to configure nginx environment');
    process.exit(1);
  }

  if (typeof process.getuid === 'function' && process.getuid() !== 0) {
    printError(`You need ${chalk.red('root / sudo')} privileges to setup nginx environment.`);
    printInfo(`Try running again with: ${chalk.cyan('sudo blocklet server nginx --setup')}`);
    process.exit(1);
  }

  printInfo('Starting nginx environment setup...');

  try {
    setupNginxEnvironment();
    printSuccess('Nginx environment setup completed successfully!');
  } catch (error) {
    printError(`Failed to setup nginx environment: ${error.message}`);
    process.exit(1);
  }
};

function detectPlatform() {
  const platform = os.platform();
  if (platform === 'linux') {
    return 'linux';
  }
  if (platform === 'darwin') {
    return 'macos';
  }
  return 'unknown';
}

function commandExists(command) {
  return !!shelljs.which(command);
}

function safeExec(command, options = {}) {
  const result = shelljs.exec(command, { silent: true, ...options });
  return {
    success: result.code === 0,
    output: result.stdout?.trim() || '',
    error: result.stderr?.trim() || '',
  };
}

function installNginxIfNeeded() {
  const nginxBinPath = shelljs.which('nginx')?.toString() || '';
  if (nginxBinPath) {
    printSuccess('Nginx found');
    return;
  }

  printInfo('Installing nginx...');
  const platform = detectPlatform();

  if (platform === 'linux') {
    if (commandExists('apt-get')) {
      printInfo('Installing nginx-extras using apt...');
      const updateResult = safeExec('sudo apt update');
      if (!updateResult.success) {
        printWarning('Failed to update package list, but continuing...');
      }

      const installResult = safeExec('sudo apt-get install -y nginx-extras');
      if (!installResult.success) {
        throw new Error(`Failed to install nginx: ${installResult.error}`);
      }
    } else if (commandExists('yum')) {
      printInfo('Installing nginx using yum...');
      const installResult = safeExec('sudo yum install -y nginx');
      if (!installResult.success) {
        throw new Error(`Failed to install nginx: ${installResult.error}`);
      }
    } else if (commandExists('dnf')) {
      printInfo('Installing nginx using dnf...');
      const installResult = safeExec('sudo dnf install -y nginx');
      if (!installResult.success) {
        throw new Error(`Failed to install nginx: ${installResult.error}`);
      }
    } else {
      throw new Error('No supported package manager found (apt, yum, dnf)');
    }
  } else if (platform === 'macos') {
    if (!commandExists('brew')) {
      throw new Error('Homebrew not found. Please install Homebrew first: https://brew.sh');
    }

    printInfo('Installing nginx using homebrew...');
    const installResult = safeExec('brew install nginx');
    if (!installResult.success) {
      throw new Error(`Failed to install nginx: ${installResult.error}`);
    }
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  if (!commandExists('nginx')) {
    throw new Error('Nginx installation failed - nginx command not found after installation');
  }

  printSuccess('Nginx installed successfully');
}

function checkNginxStreamModule() {
  const result = safeExec('nginx -V');
  if (!result.success) {
    throw new Error('Failed to check nginx version and modules');
  }

  const output = result.output + result.error;
  return output.includes('--with-stream') || output.includes('stream_core_module');
}

function ensureNginxStreamModule() {
  print();
  printInfo('Checking nginx stream module...');

  if (checkNginxStreamModule()) {
    printSuccess('Nginx stream module is available');
    return;
  }

  const platform = detectPlatform();

  if (platform === 'linux') {
    if (commandExists('apt-get')) {
      printInfo('Installing nginx stream module...');
      const installResult = safeExec('sudo apt-get install -y libnginx-mod-stream');
      if (!installResult.success) {
        printWarning('Failed to install libnginx-mod-stream package. Stream module may not be available.');
        return;
      }
    } else if (commandExists('yum')) {
      printInfo('Installing nginx stream module using yum...');
      const installResult = safeExec('sudo yum install -y nginx-mod-stream');
      if (!installResult.success) {
        printWarning('Failed to install nginx-mod-stream package. Stream module may not be available.');
        return;
      }
    } else if (commandExists('dnf')) {
      printInfo('Installing nginx stream module using dnf...');
      const installResult = safeExec('sudo dnf install -y nginx-mod-stream');
      if (!installResult.success) {
        printWarning('Failed to install nginx-mod-stream package. Stream module may not be available.');
        return;
      }
    } else {
      printWarning('Cannot install stream module on this Linux distribution. Please install manually if needed.');
      return;
    }
  } else if (platform === 'macos') {
    if (!commandExists('brew')) {
      printWarning('Homebrew not found. Please install Homebrew first to manage nginx with stream module.');
      return;
    }

    printInfo('Installing nginx with stream module using homebrew...');
    // First try to install nginx-full which includes stream module
    let installResult = safeExec('brew install nginx-full --with-stream');

    if (!installResult.success) {
      // If nginx-full is not available, try to reinstall regular nginx
      // and check if stream module is available
      printInfo('nginx-full not available, trying to reinstall nginx...');
      safeExec('brew uninstall nginx');
      installResult = safeExec('brew install nginx');

      if (!installResult.success) {
        printWarning('Failed to install nginx with stream module. Please install manually.');
        return;
      }
    }
  }

  if (checkNginxStreamModule()) {
    printSuccess('Nginx stream module installed successfully');
  } else {
    printWarning('Stream module installation may have failed. Please check manually.');
  }
}

function configureNginxPortCapabilities() {
  print();
  printInfo('Configuring nginx port binding capabilities...');

  const platform = detectPlatform();

  if (platform === 'linux') {
    const nginxPath = shelljs.which('nginx')?.toString();
    if (!nginxPath) {
      throw new Error('Nginx binary not found');
    }

    const capResult = safeExec(`sudo setcap 'cap_net_bind_service=+ep' ${nginxPath}`);
    if (!capResult.success) {
      printWarning('Failed to set port binding capabilities. Nginx may need to run as root for ports 80/443.');
      return;
    }

    printSuccess('Nginx port binding capabilities configured');
  } else if (platform === 'macos') {
    printInfo('Port binding configuration not needed on macOS');
  } else {
    printWarning('Port binding configuration not supported on this platform');
  }
}

function checkBlockletServerConfig() {
  print();
  printInfo('Checking blocklet server nginx port configuration...');

  const configPath = path.join(process.cwd(), '.blocklet-server', 'config.yml');

  if (!fs.existsSync(configPath)) {
    printWarning('Blocklet server config file not found. Skipping port configuration check.');
    return;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);

    const nginxConfig = config?.node?.routing || {};
    const { httpPort, httpsPort } = nginxConfig;

    let needsUpdate = false;

    if (httpPort !== 80) {
      printWarning(`HTTP port is set to ${httpPort}, consider changing to 80 for standard web access`);
      needsUpdate = true;
    }

    if (httpsPort !== 443) {
      printWarning(`HTTPS port is set to ${httpsPort}, consider changing to 443 for standard SSL access`);
      needsUpdate = true;
    }

    if (needsUpdate) {
      printInfo(`To update ports, modify ${configPath} and run: ${chalk.cyan('blocklet server start --update-db')}`);
    } else {
      printSuccess('Nginx port configuration looks good');
    }
  } catch (error) {
    printWarning(`Failed to parse config file: ${error.message}`);
  }
}

function ensureNginxServiceNotManaged() {
  print();
  printInfo('Checking nginx service management status...');

  const platform = detectPlatform();

  if (platform === 'linux') {
    // Check if systemd is available
    if (commandExists('systemctl')) {
      // Check if nginx service is enabled
      const enabledResult = safeExec('systemctl is-enabled nginx');
      if (enabledResult.success && enabledResult.output === 'enabled') {
        printInfo('Disabling nginx systemd service...');
        const disableResult = safeExec('sudo systemctl disable nginx');
        if (!disableResult.success) {
          printWarning(
            'Failed to disable nginx service. This may cause conflicts with blocklet server nginx management.'
          );
        } else {
          printSuccess('Nginx systemd service disabled');
        }
      }

      // Check if nginx service is running
      const activeResult = safeExec('systemctl is-active nginx');
      if (activeResult.success && activeResult.output === 'active') {
        printInfo('Stopping nginx systemd service...');
        const stopResult = safeExec('sudo systemctl stop nginx');
        if (!stopResult.success) {
          printWarning('Failed to stop nginx service. This may cause conflicts with blocklet server nginx management.');
        } else {
          printSuccess('Nginx systemd service stopped');
        }
      }
    }

    // Check for other init systems if needed
    if (commandExists('service')) {
      const statusResult = safeExec('service nginx status');
      if (statusResult.success) {
        printInfo('Stopping nginx service...');
        const stopResult = safeExec('sudo service nginx stop');
        if (!stopResult.success) {
          printWarning('Failed to stop nginx service using service command.');
        }
      }
    }
  } else if (platform === 'macos') {
    // Check for homebrew services
    if (commandExists('brew')) {
      const servicesResult = safeExec('brew services list | grep nginx');
      if (servicesResult.success && servicesResult.output.includes('started')) {
        printInfo('Stopping nginx homebrew service...');
        const stopResult = safeExec('brew services stop nginx');
        if (!stopResult.success) {
          printWarning('Failed to stop nginx homebrew service.');
        } else {
          printSuccess('Nginx homebrew service stopped');
        }
      }
    }

    // Check for launchd services
    if (commandExists('launchctl')) {
      const listResult = safeExec('launchctl list | grep nginx');
      if (listResult.success && listResult.output) {
        printWarning('Found nginx launchd services. Please manually stop them if they conflict with blocklet server.');
      }
    }
  }

  printSuccess('Nginx service management check completed');
}

function setupNginxEnvironment() {
  // Ensure nginx is installed
  installNginxIfNeeded();
  // Ensure nginx has the stream module
  ensureNginxStreamModule();
  // Ensure nginx has permission to bind low-numbered ports
  configureNginxPortCapabilities();
  // Ensure nginx is not managed by the system service manager
  ensureNginxServiceNotManaged();
  // Ensure nginx port configuration is correct
  checkBlockletServerConfig();

  print();
  printInfo('Testing nginx configuration...');
  const testResult = safeExec('nginx -t');
  if (!testResult.success) {
    printWarning('Nginx configuration test failed. Please check your nginx configuration.');
    printWarning(`Error: ${testResult.error}`);
  } else {
    printSuccess('Nginx configuration test passed');
  }

  printInfo('Nginx environment setup workflow completed');
  process.exit(0);
}
