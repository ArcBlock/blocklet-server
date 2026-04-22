const map = new WeakMap();
let counter = 0;

function weakKey(obj) {
  if (!obj || typeof obj !== 'object') {
    return 'weak-key-default';
  }
  let key = map.get(obj);
  if (!key) {
    key = `weak-key-${counter++}`;
    map.set(obj, key);
  }
  return key;
}

export default weakKey;
