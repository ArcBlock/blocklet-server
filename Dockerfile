FROM arcblock/blocklet-server-base:latest

ARG BLOCKLET_SERVER_CLI_PACKAGE
ARG TARGETPLATFORM

LABEL org.opencontainers.image.source=https://github.com/arcblock/blocklet-server

ENV HOME=/home/arcblock
ENV GROUP=arcblock
ENV USER=arcblock
ENV DATA_DIR=/data

RUN addgroup $GROUP && \
    adduser -G $GROUP -D $USER --home $HOME -s /bin/sh && \
    mkdir -p $DATA_DIR $HOME && \
    chown -R $USER:$GROUP $HOME && \
    chown -R $USER:$GROUP $DATA_DIR

ENV PNPM_HOME=$HOME/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV PNPM_VERSION=v9.5.0

RUN case "$TARGETPLATFORM" in \
        "linux/amd64") ARCH="x64";; \
        "linux/arm64") ARCH="arm64";; \
        *) echo "unsupported architecture"; exit 1 ;; \
    esac && \
    wget -qO /tmp/pnpm "https://github.com/pnpm/pnpm/releases/download/$PNPM_VERSION/pnpm-linuxstatic-$ARCH" && \
    chmod +x /tmp/pnpm && \
    /tmp/pnpm add -g $BLOCKLET_SERVER_CLI_PACKAGE && \
    /tmp/pnpm store prune && \
    rm /tmp/pnpm

ENV GOSU_VERSION=1.17
RUN set -eux; \
  \
  apk add --no-cache --virtual .gosu-deps \
    ca-certificates \
    dpkg \
    gnupg \
  ; \
  \
  dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
  wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch"; \
  wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc"; \
  \
# verify the signature
  export GNUPGHOME="$(mktemp -d)"; \
  gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
  gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu; \
  gpgconf --kill all; \
  rm -rf "$GNUPGHOME" /usr/local/bin/gosu.asc; \
  \
# clean up fetch dependencies
  apk del --no-network .gosu-deps; \
  \
  chmod +x /usr/local/bin/gosu; \
# verify that the binary works
  gosu --version; \
  gosu nobody true && \
  apk add --no-cache libcap

RUN chown $USER:$GROUP $DATA_DIR && \
    chown $USER:$GROUP $HOME && \
    setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx

WORKDIR $DATA_DIR
VOLUME $DATA_DIR

ADD entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

EXPOSE 80 443
CMD ["blocklet", "server", "start", "-a", "-u", "--keep-alive"]
