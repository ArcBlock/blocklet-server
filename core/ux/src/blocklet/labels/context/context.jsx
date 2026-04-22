import { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorageState, useReactive } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';
import Toast from '@arcblock/ux/lib/Toast';
import { LabelTreeNode, createEmptyLabelTree, initLabelTree, Label } from '../picker/tree';
import { useTeamContext } from '../../../contexts/team';
import { useNodeContext } from '../../../contexts/node';
import { formatError } from '../../../util';

import {
  getLabelNameById,
  getFullLabelNameById,
  labelExists,
  getLabelsByIds,
  addRecentLabel,
} from '../utils/labels-utils';

const LabelsContext = createContext(null);

const MAX_LABEL_COUNT = 100;

export function LabelsProvider({ children }) {
  const { locale } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();

  const state = useReactive({ loading: true, tree: createEmptyLabelTree(), stats: [], labels: [] });

  const init = async () => {
    try {
      const result = await api.getTags({ input: { teamDid, paging: { page: 1, pageSize: MAX_LABEL_COUNT } } });
      const list = (result.tags || []).map((x) => {
        if (x.createdAt) {
          x.createdAt = new Date(x.createdAt).getTime();
        }
        if (x.updatedAt) {
          x.updatedAt = new Date(x.updatedAt).getTime();
        }

        return x;
      });
      const tree = initLabelTree(list || []);

      state.labels = list;
      state.loading = false;
      state.tree = tree;
    } catch (e) {
      console.error(e);
      state.loading = false;
      Toast.error(formatError(e));
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, teamDid, state]);

  const flattened = useMemo(() => state.tree.flatten(), [state.tree]);

  const nodesKeyById = useMemo(() => {
    return flattened.reduce((acc, cur) => {
      acc[cur.data.id] = cur;
      return acc;
    }, {});
  }, [flattened]);

  const getLabelName = useCallback((id) => getLabelNameById(nodesKeyById, id, locale), [nodesKeyById, locale]);
  const getFullLabelName = useCallback((id) => getFullLabelNameById(nodesKeyById, id, locale), [nodesKeyById, locale]);
  const labelExistsFn = useCallback((id) => labelExists(nodesKeyById, id), [nodesKeyById]);
  const getLabelsByIdsFn = useCallback((ids) => getLabelsByIds(nodesKeyById, ids), [nodesKeyById]);

  const [recentLabels = [], setRecentLabels] = useLocalStorageState('recent-label-ids', { defaultValue: [] });
  const addRecentLabelFn = useCallback(
    (label) => setRecentLabels(addRecentLabel(recentLabels, label, labelExistsFn)),
    [recentLabels, labelExistsFn, setRecentLabels]
  );

  const createLabel = async (name) => {
    try {
      const saved = await api.createTag({ input: { teamDid, tag: { title: name, color: '#4B5563', slug: name } } });
      const node = new LabelTreeNode({ data: new Label(saved.tag) });
      state.tree.add(node);
      state.tree = state.tree.clone();
      return node.data;
    } catch (error) {
      Toast.error(formatError(error));
      return null;
    }
  };

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value = {
    ...state,
    flattenedLabels: flattened,
    getLabelsByIds: getLabelsByIdsFn,
    getLabelName,
    createLabel,
    getFullLabelName,
    recentLabels,
    addRecentLabel: addRecentLabelFn,
    labels: Array.from(state.labels),
    loading: state.loading,
    refetch: init,
  };

  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

LabelsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useLabels() {
  return useContext(LabelsContext);
}
