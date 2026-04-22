import { isValidElement } from 'react';
import PropTypes from 'prop-types';
import { SortableTreeWithoutDndContext as ReactSortableTree } from 'react-sortable-tree';
import MaterialTheme from 'react-sortable-tree-theme-material-ui';
import { Icon } from '@iconify/react';
import isObject from 'lodash/isObject';
import isEqual from 'lodash/isEqual';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, styled, Typography } from '@mui/material';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import BlockletIcon from '@blocklet/ui-react/lib/Icon';
import { useMemoizedFn } from 'ahooks';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import isUrl from 'is-url';

import { useBlockletContext } from '../../contexts/blocklet';
import useAppLanguages from '../../hooks/use-app-languages';

const isTemplateDraggable = (node) => node.from !== 'team-tmpl';

function checkCanDrop({ prevPath, nextPath, node }) {
  if (node.from === 'team-tmpl') {
    return false;
  }

  const prevLen = prevPath.length;
  const nextLen = nextPath.length;
  if (prevLen === nextLen) {
    if (isEqual(prevPath.slice(0, prevLen - 1), nextPath.slice(0, nextLen - 1))) {
      return true;
    }
  }
  return false;
}
function TreeTitle({ treeNode }) {
  const { locale } = useLocaleContext();
  const { blocklet } = useBlockletContext();
  const { defaultLocale } = useAppLanguages();
  const customUrl = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL);

  const withDomain = useMemoizedFn((url) => {
    if (url?.startsWith('/')) {
      try {
        return new URL(url, customUrl?.value).href;
      } catch {
        console.error('Failed to parse url', {
          url,
          origin: customUrl?.value,
        });
      }
    }
    return url;
  });
  function renderTitle() {
    const { title, subtitle } = treeNode;
    let titleShow = title;
    let subtitleShow = subtitle;
    if (isObject(title)) {
      titleShow = title[locale] || title[defaultLocale] || title.en;
    }
    if (!isValidElement(subtitle) && isObject(subtitle)) {
      subtitleShow = subtitle[locale] || subtitle[defaultLocale] || subtitle.en;
    }
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: 16,
          }}>
          {titleShow}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="gray"
            sx={{
              ml: 1.5,
              lineHeight: 1,
            }}>
            {subtitleShow}
          </Typography>
        )}
      </Box>
    );
  }
  return (
    <>
      {treeNode.icon &&
        (isUrl(withDomain(treeNode.icon)) ? (
          <BlockletIcon size={16} style={{ marginRight: 4 }} icon={withDomain(treeNode.icon)} />
        ) : (
          <Icon size={16} style={{ marginRight: 4 }} icon={treeNode.icon} />
        ))}
      {renderTitle()}
    </>
  );
}

TreeTitle.propTypes = {
  treeNode: PropTypes.object.isRequired,
};

const Wrapper = styled(Box)(({ theme }) => ({
  '& .MuiNodeContent-row': {
    backgroundColor: theme.palette.background.default,
  },
}));

function SortableTree({ treeData, setTreeData = () => {}, renderActions = () => {} }) {
  const expandedData = treeData.map((item) => ({
    ...item,
    expanded: true,
  }));

  // HACK: 兼容 mui-datatables 中的 react-dnd 使用
  const dndProps = {};
  if (typeof window !== 'undefined') {
    dndProps.context = window;
  }

  return (
    <Wrapper>
      <DndProvider backend={HTML5Backend} {...dndProps}>
        <ReactSortableTree
          generateNodeProps={(rowInfo) => {
            const canDrag = isTemplateDraggable(rowInfo.node);

            return {
              buttons: renderActions({ data: rowInfo.node, className: 'list-item-actions' }),
              icons: canDrag ? (
                <Icon icon="ic:round-drag-indicator" />
              ) : (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                  }}
                />
              ),
              title: <TreeTitle treeNode={rowInfo.node} />,
            };
          }}
          maxDepth={2}
          isVirtualized={false}
          treeData={expandedData}
          onChange={setTreeData}
          canDrop={checkCanDrop}
          theme={MaterialTheme}
        />
      </DndProvider>
    </Wrapper>
  );
}
SortableTree.propTypes = {
  treeData: PropTypes.object.isRequired,
  setTreeData: PropTypes.func,
  renderActions: PropTypes.func,
};

export default SortableTree;
