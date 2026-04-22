FROM ubuntu:22.04

SHELL ["/bin/bash", "-c"]

RUN apt update -y && \
    apt install -y nginx nginx-extras curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    apt install -y nodejs git vim dnsutils && \
    node -v

ARG BLOCKLET_SERVER_CLI_PACKAGE
ARG TARGETPLATFORM

LABEL org.opencontainers.image.source=https://github.com/arcblock/blocklet-server

ENV HOME=/root
ENV GROUP=root
ENV USER=root
ENV DATA_DIR=/data

USER $USER
WORKDIR $HOME

ENV PNPM_HOME=$HOME/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

RUN npm install -g pnpm && \
    pnpm -v && \
    pnpm install -g --allow-build=sqlite3 $BLOCKLET_SERVER_CLI_PACKAGE && \
    pnpm install -g @arcblock/pm2

WORKDIR $DATA_DIR
VOLUME $DATA_DIR

RUN echo 'echo "!!WARNING!! This image is only suitable for developing Blocklets. To deploy Blocklet Server services, use the arcblock/blocklet-server:latest image."' > /root/.bashrc

ADD blocklet-dev-entrypoint.sh /usr/local/bin/blocklet-dev-entrypoint.sh
RUN chmod +x /usr/local/bin/blocklet-dev-entrypoint.sh
ENTRYPOINT ["blocklet-dev-entrypoint.sh"]

EXPOSE 80 443
CMD ["blocklet", "server", "start", "-a", "-u", "--keep-alive"]
