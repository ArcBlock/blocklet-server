import { joinURL } from 'ufo';
import { Blocklet, BlockletComponent } from '../types';

// FIXME: Since ComponentService depends on the blocklet instance (fetched asynchronously),
// users must instantiate ComponentService manually for now.
// Revisit once SDK init can synchronously access the blocklet instance.
export class ComponentService {
  private blocklet: Blocklet;

  constructor({ blocklet = window?.blocklet }: { blocklet?: Blocklet } = {}) {
    this.blocklet = blocklet;
  }

  getComponent(name: string) {
    const componentMountPoints: BlockletComponent[] = this.blocklet?.componentMountPoints || [];
    const item = componentMountPoints.find((x: any) => [x.title, x.name, x.did].includes(name));
    return item;
  }

  getComponentMountPoint(name?: string): string {
    const component: any = this.getComponent(name);
    return component?.mountPoint || '';
  }

  getUrl(name: string, ...parts: string[]): string {
    const mountPoint = this.getComponentMountPoint(name);
    const appUrl = this.blocklet?.appUrl || '';
    return joinURL(appUrl, mountPoint, ...parts);
  }
}
