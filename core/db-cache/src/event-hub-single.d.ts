// Type declarations for @arcblock/event-hub/single
// This is needed because moduleResolution: "node" doesn't support package.json exports field

declare module '@arcblock/event-hub/single' {
  import { EventEmitter } from 'node:events';

  class Client extends EventEmitter {
    broadcast(...args: Parameters<EventEmitter['emit']>): boolean;
    off(event: string | symbol): this;
  }

  const client: Client;
  export default client;
  export { Client };
}
