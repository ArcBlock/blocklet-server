// In strict mode, we are need to declare the type of the js module

declare module '@abtnode/util/lib/axios' {
  const Default: any;
  export default Default;
}

declare module '@abtnode/util/lib/security' {
  const encodeEncryptionKey: any;
  export { encodeEncryptionKey };
}

declare module 'tweetnacl-sealedbox-js' {
  const Default: any;
  export default Default;
}
declare module '@abtnode/util/lib/create-blocklet-release' {
  const Default: any;
  export { createRelease };
}

declare module '@abtnode/constant' {
  const BLOCKLET_STORE_META_PATH: string;
  export { BLOCKLET_STORE_META_PATH };
}