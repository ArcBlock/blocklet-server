import { useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useSize, useDeepCompareLayoutEffect } from 'ahooks';
import PropTypes from 'prop-types';
import { useLabels } from './context/context';
import LabelChip from './chip';

function Labels({
  compact = true,
  labels = [],
  sx = [],
  renderLabel = undefined,
  renderWhenEmpty = undefined,
  prepend = undefined,
  displaySystemLabels = true,
  onItemClick = undefined,
}) {
  const { getLabelsByIds, loading } = useLabels();
  const wrapperRef = useRef(null);
  const size = useSize(wrapperRef);
  const [overflowIndex, setOverflowIndex] = useState(99999);

  let labelNodes = getLabelsByIds(labels || []);
  if (!displaySystemLabels) {
    labelNodes = labelNodes.filter((x) => x.data.type !== 'system');
  }

  useDeepCompareLayoutEffect(() => {
    if (!compact || !wrapperRef.current) {
      setOverflowIndex(99999);
      return;
    }

    const { right } = wrapperRef.current.getBoundingClientRect();
    const elements = wrapperRef.current.querySelectorAll('.MuiChip-root');

    Array.from(elements).some((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > right - 36) {
        setOverflowIndex(i);
        return true;
      }
      return false;
    });
  }, [size, compact]);

  if (loading) return null;

  const mergedSx = [
    {
      display: 'flex',
      gap: 1,
      width: '100%',
      alignItems: 'center',
      overflow: 'hidden',
      flexWrap: compact ? 'no-wrap' : 'wrap',
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ];

  return (
    <Box sx={mergedSx} ref={wrapperRef}>
      {prepend}

      {labelNodes.length === 0 && renderWhenEmpty}

      {labelNodes.map((item, index) => {
        if (!item) return null;

        const visible = index < overflowIndex;
        const isOverflow = index === overflowIndex;

        const labelChip = (
          <LabelChip
            key={item.data.id}
            label={item.data}
            onClick={onItemClick}
            sx={{
              visibility: visible ? 'visible' : 'hidden',
              pointerEvents: visible ? 'auto' : 'none',
            }}
          />
        );

        const finalChip = renderLabel ? renderLabel(item, labelChip) : labelChip;

        if (isOverflow) {
          return [
            <Box
              key="overflow-label"
              sx={{
                display: 'inline-flex',
                ...(compact && { height: 20, lineHeight: '20px' }),
                color: 'text.secondary',
                fontWeight: 'bold',
                fontSize: 14,
              }}>
              {`+${labelNodes.length - overflowIndex}`}
            </Box>,
            finalChip,
          ];
        }

        return finalChip;
      })}
    </Box>
  );
}

Labels.propTypes = {
  compact: PropTypes.bool,
  labels: PropTypes.array,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  renderLabel: PropTypes.func,
  renderWhenEmpty: PropTypes.func,
  prepend: PropTypes.node,
  displaySystemLabels: PropTypes.bool,
  onItemClick: PropTypes.func,
};

export default Labels;
