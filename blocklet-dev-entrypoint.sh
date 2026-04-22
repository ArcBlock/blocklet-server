#!/usr/bin/env bash

echo "!!WARNING!! This image is only suitable for developing Blocklets. To deploy Blocklet Server services, use the arcblock/blocklet-server:latest image."

exec "$@"
