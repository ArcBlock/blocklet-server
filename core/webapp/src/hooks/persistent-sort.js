/* eslint-disable no-use-before-define */
import useLocalStorage from 'react-use/lib/useLocalStorage';

export default function usePersistentSort(name, initialDirections) {
  const [sortDirections, setSortDirections] = useLocalStorage(`ps_${name}`, initialDirections);

  const onSortChange = (columnIndex, directionValue) => {
    const newSortDirections = directionValue ? new Array(initialDirections.length).fill('') : [...initialDirections];

    if (columnIndex > -1) {
      newSortDirections[columnIndex] = directionValue;
    }

    setSortDirections(newSortDirections);
  };

  return {
    sortDirections, // 当前的排序
    onSortChange, // 给外部的回调，可以更新内部的 sort
  };
}
