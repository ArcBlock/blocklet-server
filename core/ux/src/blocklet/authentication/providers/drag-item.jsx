import PropTypes from 'prop-types';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Icon } from '@iconify/react';
import noop from 'lodash/noop';
import DragIndicatorIcon from '@iconify-icons/material-symbols/drag-indicator';
import iconDeleteRounded from '@iconify-icons/material-symbols/delete-rounded';
import iconEditRounded from '@iconify-icons/material-symbols/edit-rounded';

export default function DragItem({
  // eslint-disable-next-line no-unused-vars
  id,
  title,
  index,
  onBegin = noop,
  onMove,
  onEnd,
  onEditItem = noop,
  onDeleteItem = noop,
  disableDelete = false,
  icon = null,
}) {
  const dropRef = useRef(null);
  const dragRef = useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'dragItem',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!dropRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = dropRef.current?.getBoundingClientRect();
      const dragBoundingRect = dragRef.current?.getBoundingClientRect();
      // 需要拖动多少距离才能触发位置变更
      const dragY = (dragBoundingRect.bottom - dragBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < dragY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > dragY) {
        return;
      }
      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    item: {
      index,
      type: 'dragItem',
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    begin: onBegin,
    end: onEnd,
  });
  drag(dragRef);
  drop(dropRef);
  const opacity = isDragging ? 0.3 : 1;

  return (
    <Box ref={dropRef}>
      <Box
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'grey.100',
          },
        }}
        ref={dragRef}
        data-handler-id={handlerId}>
        <Box
          sx={{
            py: 2,
            px: 1,
            opacity,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
          draggable={false}>
          <Box
            sx={{
              pointerEvents: 'auto',
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              fontSize: 0,
              color: 'text.hint',
              '&:hover': {
                color: 'text.secondary',
              },
            }}>
            <Icon fontSize={20} icon={DragIndicatorIcon} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              mr: 0.5,
              // HACK: 图标与文字在视觉上是不居中的，通过偏移来调整，优化视觉体验
              transform: 'translateY(-1px)',
            }}>
            {icon}
          </Box>
          <Typography sx={{ flex: 1 }}>{title}</Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              onEditItem(id);
            }}>
            <Icon icon={iconEditRounded} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              onDeleteItem(id);
            }}
            disabled={disableDelete}>
            <Icon icon={iconDeleteRounded} />
          </IconButton>
        </Box>
        <Divider />
      </Box>
    </Box>
  );
}

DragItem.propTypes = {
  title: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onBegin: PropTypes.func,
  onMove: PropTypes.func.isRequired,
  onEnd: PropTypes.func.isRequired,
  onEditItem: PropTypes.func,
  onDeleteItem: PropTypes.func,
  disableDelete: PropTypes.bool,
  icon: PropTypes.any,
};
