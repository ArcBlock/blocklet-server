import { uniq } from 'lodash';

export function getLabelNameById(nodesKeyById, id, locale) {
  return nodesKeyById[id]?.data.getName(locale);
}

export function getFullLabelNameById(nodesKeyById, id, locale) {
  return nodesKeyById[id]?.getFullName(locale) ?? id;
}

export function labelExists(nodesKeyById, id) {
  return !!nodesKeyById[id];
}

export function getLabelsByIds(nodesKeyById, ids) {
  return ids.map((id) => nodesKeyById[id]).filter(Boolean);
}

export function addRecentLabel(recentLabels, label, exists) {
  if (!label || !exists(label)) return recentLabels;
  return uniq([label, ...recentLabels]).slice(0, 10);
}
