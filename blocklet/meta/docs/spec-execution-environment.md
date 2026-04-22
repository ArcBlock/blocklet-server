# Execution & Environment

The execution and environment configuration within your `blocklet.yml` is the blueprint for how your Blocklet runs. It specifies the necessary runtime, defines system requirements, exposes configuration options to users, and hooks into the Blocklet's lifecycle. Getting this section right is crucial for creating a portable, robust, and user-friendly application.

This section covers five key areas: `engine`, `docker`, `requirements`, `environments`, `scripts`, and `timeout`.

## Engine (`engine`)

This property specifies the execution engine for your blocklet, defining the runtime and how it should be started. For most JavaScript-based blocklets, you'll specify `node` as the interpreter, and the `main` property (defined at the root of `blocklet.yml`) will serve as the entry point.

```yaml A Simple Node.js Engine icon=mdi:language-yaml
name: my-node-blocklet
main: build/index.js
engine:
  interpreter: node
```

You can also provide an array of engine configurations to support multiple platforms, which is ideal for binary distributions.

```yaml Multi-Platform Engine Configuration icon=mdi:language-yaml
# ... other properties
engine:
  - platform: linux
    interpreter: binary
    source: ./bin/server-linux
  - platform: darwin
    interpreter: binary
    source: ./bin/server-macos
  - platform: win32
    interpreter: binary
    source: ./bin/server-win.exe
```

### Engine Properties

<x-field-group>
  <x-field data-name="interpreter" data-type="string" data-default="node">
    <x-field-desc markdown>The runtime to execute the blocklet. Valid values: `node`, `blocklet`, `binary`, `bun`.</x-field-desc>
  </x-field>
  <x-field data-name="platform" data-type="string" data-required="false">
    <x-field-desc markdown>Optional OS platform. Used when `engine` is an array to specify configurations for different OSs (e.g., `linux`, `darwin`, `win32`).</x-field-desc>
  </x-field>
  <x-field data-name="source" data-type="string | object" data-required="false">
    <x-field-desc markdown>The source of the engine if the interpreter is `blocklet`. Can be a URL string, or an object referencing a URL or the Blocklet Store.</x-field-desc>
  </x-field>
  <x-field data-name="args" data-type="string[]" data-default="[]" data-required="false">
    <x-field-desc markdown>An array of command-line arguments to pass to the executable.</x-field-desc>
  </x-field>
</x-field-group>

## Docker (`docker`)

As an alternative to the `engine` property, you can use `docker` to run your blocklet in a containerized environment. This is ideal for applications with complex dependencies or non-JavaScript runtimes. You must provide either an `image` or a `dockerfile`.

```yaml Using a Pre-built Docker Image icon=mdi:docker
docker:
  image: 'nginx:latest'
  egress: true
```

When using a `dockerfile`, you must also include its path in the root `files` array.

```yaml Building from a Dockerfile icon=mdi:docker
docker:
  dockerfile: 'Dockerfile.prod'
files:
  - 'Dockerfile.prod'
```

### Docker Properties

<x-field-group>
  <x-field data-name="image" data-type="string" data-required="false">
    <x-field-desc markdown>The name of the Docker image to use.</x-field-desc>
  </x-field>
  <x-field data-name="dockerfile" data-type="string" data-required="false">
    <x-field-desc markdown>The path to the Dockerfile to build the image. You cannot use `image` and `dockerfile` at the same time.</x-field-desc>
  </x-field>
  <x-field data-name="egress" data-type="boolean" data-default="true" data-required="false">
    <x-field-desc markdown>Whether the blocklet can access the external network.</x-field-desc>
  </x-field>
</x-field-group>

## Runtime Requirements (`requirements`)

This object defines the environment constraints necessary for the blocklet to run correctly. The system will check these requirements before installation to ensure compatibility.

```yaml Example Requirements icon=mdi:language-yaml
requirements:
  server: '>=1.16.0'
  os: '*'
  cpu: 'x64'
  nodejs: '>=18.0.0'
```

### Requirement Properties

<x-field-group>
  <x-field data-name="server" data-type="string">
    <x-field-desc markdown>A valid SemVer range for the required Blocklet Server version. Defaults to the latest stable version.</x-field-desc>
  </x-field>
  <x-field data-name="os" data-type="string | string[]" data-default="*">
    <x-field-desc markdown>The compatible operating system(s). Use `*` for any. Can be a single string or an array (e.g., `['linux', 'darwin']`). Valid platforms include `aix`, `darwin`, `freebsd`, `linux`, `openbsd`, `sunos`, `win32`.</x-field-desc>
  </x-field>
  <x-field data-name="cpu" data-type="string | string[]" data-default="*">
    <x-field-desc markdown>The compatible CPU architecture(s). Use `*` for any. Can be a single string or an array (e.g., `['x64', 'arm64']`). Valid architectures include `arm`, `arm64`, `ia32`, `mips`, `mipsel`, `ppc`, `ppc64`, `s390`, `s390x`, `x32`, `x64`.</x-field-desc>
  </x-field>
  <x-field data-name="nodejs" data-type="string" data-default="*">
    <x-field-desc markdown>A valid SemVer range for the required Node.js version.</x-field-desc>
  </x-field>
  <x-field data-name="fuels" data-type="array" data-required="false">
    <x-field-desc markdown>Specifies a list of required assets (tokens) in a connected wallet for certain operations.</x-field-desc>
  </x-field>
  <x-field data-name="aigne" data-type="boolean" data-required="false">
    <x-field-desc markdown>If `true`, indicates the blocklet requires an AI Engine to be available.</x-field-desc>
  </x-field>
</x-field-group>

## Environment Variables (`environments`)

The `environments` array allows you to define custom configuration variables. These are presented to the user during installation or on the blocklet's configuration page, allowing them to securely input API keys, set feature flags, or customize behavior.

```yaml Environment Variable Definitions icon=mdi:language-yaml
environments:
  - name: 'API_KEY'
    description: 'Your secret API key for the external service.'
    required: true
    secure: true
  - name: 'FEATURE_FLAG_BETA'
    description: 'Enable the beta feature for this blocklet.'
    required: false
    default: 'false'
    validation: '^(true|false)$'
```

**Key Naming Rules:**
- Names must not start with the reserved prefixes `BLOCKLET_`, `COMPONENT_`, or `ABTNODE_`.
- Names can only contain letters, numbers, and underscores (`_`).

### Environment Properties

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>The name of the environment variable.</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string" data-required="true">
    <x-field-desc markdown>A user-friendly description of what this variable is for.</x-field-desc>
  </x-field>
  <x-field data-name="default" data-type="string" data-required="false">
    <x-field-desc markdown>An optional default value. Cannot be used if `secure` is `true`.</x-field-desc>
  </x-field>
  <x-field data-name="required" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>Whether the user must provide a value for this variable.</x-field-desc>
  </x-field>
  <x-field data-name="secure" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>If true, the value is treated as sensitive data (e.g., passwords, API keys), stored encrypted, and hidden in the UI.</x-field-desc>
  </x-field>
  <x-field data-name="validation" data-type="string" data-required="false">
    <x-field-desc markdown>An optional regex string to validate the user's input.</x-field-desc>
  </x-field>
  <x-field data-name="shared" data-type="boolean" data-required="false">
    <x-field-desc markdown>If true, this variable can be shared among components. Defaults to `false` if `secure` is `true`.</x-field-desc>
  </x-field>
</x-field-group>

## Lifecycle Scripts (`scripts`)

Scripts are shell commands that hook into the blocklet's lifecycle, allowing you to perform automated tasks at specific stages like installation, startup, or uninstallation. The following diagram illustrates when the installation and startup hooks are executed:

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Execution & Environment](assets/diagram/execution-environment-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

```yaml Script Hook Examples icon=mdi:language-yaml
scripts:
  pre-install: 'npm install --production'
  post-start: 'node ./scripts/post-start.js'
  pre-stop: 'echo "Shutting down..."'
```

### Available Hooks

| Hook (`kebab-case`) | When It Runs                                                              |
|---------------------|---------------------------------------------------------------------------|
| `dev`               | The command to run the blocklet in development mode.                      |
| `e2eDev`            | The command to run for end-to-end testing in a development environment.   |
| `pre-flight`        | Before the installation process begins, for initial checks.               |
| `pre-install`       | Before the blocklet files are copied to their final destination.          |
| `post-install`      | After the blocklet has been successfully installed.                       |
| `pre-start`         | Before the blocklet's main process is started.                            |
| `post-start`        | After the blocklet has successfully started.                              |
| `pre-stop`          | Before the blocklet is stopped.                                           |
| `pre-uninstall`     | Before the blocklet is uninstalled.                                       |
| `pre-config`        | Before the configuration user interface is displayed to the user.         |

## Timeouts (`timeout`)

This object allows you to configure maximum wait times for critical lifecycle operations to prevent processes from hanging indefinitely.

```yaml Timeout Configuration icon=mdi:language-yaml
timeout:
  start: 120  # Wait up to 120 seconds for the blocklet to start
  script: 600 # Allow scripts to run for up to 10 minutes
```

### Timeout Properties

<x-field-group>
  <x-field data-name="start" data-type="number" data-default="60">
    <x-field-desc markdown>The maximum time in seconds to wait for the blocklet to start. Must be between 10 and 600.</x-field-desc>
  </x-field>
  <x-field data-name="script" data-type="number">
    <x-field-desc markdown>The maximum time in seconds for any lifecycle script to run. Must be between 1 and 1800.</x-field-desc>
  </x-field>
</x-field-group>

---

With the execution environment configured, the next step is to define how your blocklet communicates with the outside world. Proceed to the [Interfaces & Services](./spec-interfaces-services.md) section to learn how to expose web pages and API endpoints.