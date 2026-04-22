#!/bin/sh
set -e

META_DATA_DIR=/home/arcblock/.arcblock
DATA_DIR=/data

# allow the container to be started with `--user`
if [ "$1" = 'blocklet' -a "$(id -u)" = '0' ]; then
  if [ -d $META_DATA_DIR ]; then
    echo 'ensuring arcblock user has full access to' $META_DATA_DIR
	  find $META_DATA_DIR \! -user arcblock -exec chown -R arcblock:arcblock '{}' +
  fi

  if [ -d $DATA_DIR ]; then
    echo 'ensuring arcblock user has full access to' $DATA_DIR
    chown arcblock:arcblock $DATA_DIR

    SERVER_DIR=$DATA_DIR/.blocklet-server
    if [ -d $SERVER_DIR ]; then
	    find $SERVER_DIR \! -user arcblock -exec chown -R arcblock:arcblock '{}' +
    fi
  fi
	exec gosu arcblock "$0" "$@"
fi

exec "$@"
