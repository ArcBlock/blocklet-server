import { isVolumePath } from './docker-parse-command';

export const dockerArgsValidator: Record<string, (value: string) => string> = {
  '--volume': (volume) => {
    // 拆分 hostPart:containerPart[:options]
    const [hostPart] = volume.split(':');
    if (!hostPart) {
      return 'Volume must start with key:value';
    }

    const isPath = isVolumePath(volume);
    if (isPath && !volume.startsWith('$BLOCKLET_APP_DIR/') && !volume.startsWith('$BLOCKLET_DATA_DIR/')) {
      // @ts-ignore
      return 'Volume must start with $BLOCKLET_APP_DIR or $BLOCKLET_DATA_DIR';
    }
    if (volume.indexOf('..') > -1) {
      // @ts-ignore
      return 'Volume cannot contain ".."';
    }
    return '';
  },
};
