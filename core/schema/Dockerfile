FROM golang:1.18.1-alpine3.15

WORKDIR /home/root/schema
ENV HOME=/home/root

RUN go install github.com/danielvladco/go-proto-gql/protoc-gen-gogqlgen@v0.7.3
RUN go install github.com/danielvladco/go-proto-gql/protoc-gen-gql@v0.7.3
RUN go install github.com/danielvladco/go-proto-gql/protoc-gen-gqlgencfg@v0.7.3

RUN PB_REL="https://github.com/protocolbuffers/protobuf/releases" && \
    wget $PB_REL/download/v3.15.8/protoc-3.15.8-linux-x86_64.zip && \
    unzip protoc-3.15.8-linux-x86_64.zip -d /tmp/protoc && \
    cp -R /tmp/protoc/include /usr/include && \
    rm protoc-3.15.8-linux-x86_64.zip && \
    rm -rf /tmp/protoc && \
    apk add --update make nodejs protoc sed

ENTRYPOINT ["make"]
