# Blocklet Server CLI

This package contains 2 command utilities to manage Blocklet Server and Blocklets

- `blocklet`: manage blocklets, such as init/dev/bundle/deploy/publish
- `blocklet server`: manage Blocklet Server instances, such as init/start/stop/export

## Getting Started

```shell
# install
npm install -g @blocklet/cli

# initialize and start a new node
blocklet server init -f
blocklet server start
```

Now your Blocklet Server is up and running.

## `blocklet server` command

```terminal
Powered By
     _             ____  _            _    
    / \   _ __ ___| __ )| | ___   ___| | __
   / _ \ | '__/ __|  _ \| |/ _ \ / __| |/ /
  / ___ \| | | (__| |_) | | (_) | (__|   < 
 /_/   \_\_|  \___|____/|_|\___/ \___|_|\_\
                                           
            Blocklet CLI v1.17.12

Usage: blocklet server [options] [command]

Manage Blocklet Server

Options:
  -V, --version              output the version number
  -c --config [node-config]  Blocklet Server configuration file
  -y --yes                   Automatic yes to prompts (default: false)
  -h, --help                 display help for command

Commands:
  start [options]            Start Blocklet Server
  init [options]             Init Blocklet Server config
  status [options]           Show Blocklet Server and blocklet status
  logs [options]             Show Blocklet Server and blocklet log files
  stop [options]             Stop Blocklet Server and blocklets
  info [options]             Get environment information for debugging and
                             issue reporting
  cleanup [options]          Do some server level cleanup work
  migrate [options]          Migrate database from sqlite to postgres
  nginx [options]            Configure nginx as reverse proxy for Blocklet
                             Server
  upgrade                    Self-Upgrade Blocklet Server
  help [command]             display help for command

None of the above command seems help? Consider command line utility blocklet.
```

## `blocklet` command

```terminal
Usage: blocklet [options] [command]

Options:
  -V, --version                     output the version number
  -y --yes                          Automatic yes to prompts (default: false)
  -h, --help                        display help for command

Commands:
  bundle [options]                  Bundle a blocklet that can run in Blocklet
                                    Server
  deploy [options] <folder>         Deploy blocklet from local directory to
                                    Blocklet Server
  dev [options]                     Develop blocklet from current directory
  test                              Setup blocklet test environment
  init [options]                    Create an empty blocklet project
  meta                              Print blocklet meta from a directory
  version [options] [newVersion]    Bump blocklet version and persist to disk
  upload [options] [metafile]       Upload the blocklet to blocklet store
  exec [options] <script>           Execute script in blocklet running context
  debug [options] <value>           Setting debug environment for blocklet
  connect [options] <store-url>     Connect to blocklet store. This command
                                    will set store configuration by "blocklet
                                    config"
  create [options] [name]           Bootstrap a brand new blocklet from various
                                    starter templates within minutes
  component [options] [command...]  Execute the Component Studio CLI commands
  add [options] <component>         Add component to blocklet.yml
  remove <component>                Remove component from blocklet.yml
  cleanup [options]                 Do some blocklet level cleanup work
  delete [options]                  Delete a blocklet completely from the
                                    server
  export [options]                  Export blocklet data for cross-server
                                    migration
  import <input-dir>                Import blocklet data from an export
                                    directory
  document                          Manage DID document for the blocklet or the
                                    Blocklet Server
  config [options]                  Manage the configuration for Blocklet CLI,
                                    use blocklet config help to see detail
  server [options]                  Manage Blocklet Server
  help [command]                    display help for command
```

## Documentation

https://developer.blocklet.io/docs
