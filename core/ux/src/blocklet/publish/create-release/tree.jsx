import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import classnames from 'classnames';
import isUrl from 'is-url';

import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import Checkbox from '@mui/material/Checkbox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Icon } from '@iconify/react';

import Images from '../../../images';

// BFS algorithm to find node by his ID
const bfsSearch = (graph, targetId) => {
  const queue = [...graph];

  while (queue.length > 0) {
    const currNode = queue.shift();
    if (currNode.id === targetId) {
      return currNode;
    }
    if (currNode.children) {
      queue.push(...currNode.children);
    }
  }
  return []; // Target node not found
};

function ResourceIcon({ icon = '' }) {
  if (!icon) {
    return null;
  }

  if (isUrl(icon)) {
    return <img className="resource-icon" src={icon} alt="icon" />;
  }

  return <Icon className="resource-icon" icon={icon} />;
}

ResourceIcon.propTypes = {
  icon: PropTypes.string,
};

export default function Tree({ disabled = false, data = [], onChange = () => {}, value = [] }) {
  const selectedNodes = value;

  // Retrieve all ids from node to his children's
  function getAllIds(node, idList = []) {
    idList.push(node.id);
    if (node.children) {
      node.children.forEach((child) => getAllIds(child, idList));
    }
    return idList;
  }
  // Get IDs of all children from specific node
  const getAllChild = (id) => {
    return getAllIds(bfsSearch(data, id));
  };

  // Get all father IDs from specific node
  const getAllFathers = (id, list = []) => {
    const node = bfsSearch(data, id);
    if (node.parent) {
      list.push(node.parent);

      return getAllFathers(node.parent, list);
    }

    return list;
  };

  function isAllChildrenChecked(node, list) {
    const allChild = getAllChild(node.id);
    const nodeIdIndex = allChild.indexOf(node.id);
    allChild.splice(nodeIdIndex, 1);

    return allChild.every((nodeId) => selectedNodes.concat(list).includes(nodeId));
  }

  const handleNodeSelect = (event, nodeId) => {
    event.stopPropagation();
    const allChild = getAllChild(nodeId);
    const fathers = getAllFathers(nodeId);

    if (selectedNodes.includes(nodeId)) {
      // Need to de-check
      const newValue = selectedNodes.filter((id) => !allChild.concat(fathers).includes(id));
      onChange(newValue);
    } else {
      // Need to check
      const ToBeChecked = allChild;
      for (let i = 0; i < fathers.length; ++i) {
        if (isAllChildrenChecked(bfsSearch(data, fathers[i]), ToBeChecked)) {
          ToBeChecked.push(fathers[i]);
        }
      }
      onChange([...selectedNodes].concat(ToBeChecked));
    }
  };

  const stopExpand = (event) => {
    // prevent the click event from propagating to the checkbox
    event.stopPropagation();
  };

  const hadChildren = data.some((node) => node.children?.length > 0);

  const renderTree = (node) => {
    const checked = selectedNodes.indexOf(node.id) !== -1;
    const hasChildren = Array.isArray(node.children);
    const allChild = getAllChild(node.id);
    const indeterminate = hasChildren && !checked && selectedNodes.some((id) => allChild.includes(id));
    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={
          <FormControlLabel
            onClick={stopExpand}
            control={
              <Checkbox
                size="small"
                checked={checked}
                indeterminate={indeterminate}
                tabIndex={-1}
                disableRipple
                onClick={(event) => handleNodeSelect(event, node.id)}
                disabled={node.disabled || disabled}
              />
            }
            label={
              <Box className="content">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  {node.icon && <ResourceIcon icon={node.icon} />}
                  <Box className="name">{node.name}</Box>
                  {node.url && (
                    // eslint-disable-next-line jsx-a11y/control-has-associated-label
                    <a href={node.url} target="_blank" rel="noreferrer" className="link">
                      <OpenInNewIcon className="link-icon" />
                    </a>
                  )}
                </Box>
                {!!node.description && <Box className="description">{node.description}</Box>}
                {!!node.images?.length && <Images className="images" data={node.images} lazy />}
              </Box>
            }
          />
        }>
        {hasChildren ? node.children.map(renderTree) : null}
      </TreeItem>
    );
  };

  return (
    <StyledTreeView
      className={classnames(!hadChildren && 'no-children')}
      multiSelect
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      selected={selectedNodes}>
      {data.map((node) => renderTree(node))}
    </StyledTreeView>
  );
}

Tree.propTypes = {
  data: PropTypes.array,
  value: PropTypes.array,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

const StyledTreeView = styled(SimpleTreeView)`
  &.no-children {
    .MuiTreeItem-content {
      padding: 0;
      .MuiTreeItem-iconContainer {
        display: none;
      }
      .MuiTreeItem-label {
        padding-left: 0;
      }
    }
  }
  .MuiTreeItem-content {
    align-items: flex-start;
    .MuiTreeItem-iconContainer {
      transform: translateY(10px);
    }
    &.Mui-selected {
      background-color: transparent;
    }
  }
  .MuiTreeItem-label {
    cursor: default;
  }
  .MuiFormControlLabel-root {
    align-items: flex-start;
  }
  .content {
    padding-top: 6px;
  }
  .name {
    font-size: 16px;
    font-weight: 700;
  }
  .resource-icon {
    margin-right: 2px;
    font-size: 16px;
  }
  img.resource-icon {
    width: 1rem;
    height: 1rem;
  }
  .link {
    margin-left: 8px;
    font-size: 16px;
    color: ${({ theme }) => theme.palette.primary.main};
    display: flex;
  }
  .link-icon {
    font-size: inherit;
  }
  .description {
    font-size: 14px;
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;
