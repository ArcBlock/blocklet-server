// Get current host UID/GID (fallback to 1000 if unavailable)
const HOST_UID = process.getuid?.() ?? 1000;
const HOST_GID = process.getgid?.() ?? 1000;

// Define Dockerfile with dynamic UID/GID mapping
const debainWrapDockerfile = (wrapImage) =>
  `
# Base image
FROM ${wrapImage}

USER root

# Accept host UID/GID as build args
ARG HOST_UID=${HOST_UID}
ARG HOST_GID=${HOST_GID}

# Remap node user/group and ensure /var/lib/blocklet is owned correctly
RUN set -eux; \
    if getent group "${HOST_GID}" >/dev/null; then \
        usermod -aG "${HOST_GID}" node; \
    else \
        groupmod -g "${HOST_GID}" node; \
    fi && \
    if [ "$(id -u node)" != "${HOST_UID}" ]; then \
        if getent passwd "${HOST_UID}" >/dev/null; then \
            echo "Warning: UID ${HOST_UID} EXISTED, SKIP"; \
        else \
            usermod -u "${HOST_UID}" node; \
        fi \
    fi

RUN mkdir -p /var/lib/blocklet
RUN chown -R node:node /var/lib/blocklet
RUN mkdir -p /root/.local/share
RUN chmod 777 /root
RUN chmod 777 /root/.local
RUN chmod -R 777 /root/.local/share

USER node

WORKDIR /var/lib/blocklet
`.trim();

module.exports = debainWrapDockerfile;
