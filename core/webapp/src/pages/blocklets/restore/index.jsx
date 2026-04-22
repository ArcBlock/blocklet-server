import FromSpaces from './from-spaces';
import FromServer from './from-server';

export default function BlockletRestore() {
  const { search } = window.location;
  if (search.includes('restoreFrom=server')) {
    return <FromServer />;
  }
  return <FromSpaces />;
}
