import { Box } from '@mui/material';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSize } from 'ahooks';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import LabelPicker from './label';
import LabelChip from '../chip';
import Select from './select';
import { useLabels } from '../context/context';

function LabelsInput({
  value = [],
  onChange = () => {},
  LabelPickerProps = {},
  disabled = false,
  sx = [],
  compact = true,
  multiple = true,
  ...rest
}) {
  const { getLabelsByIds, loading } = useLabels();
  const valueOptions = useMemo(() => getLabelsByIds(value), [getLabelsByIds, value]);
  const hasValue = value?.length > 0;
  const mergedSx = [{}, ...(Array.isArray(sx) ? sx : [sx])];
  const { t } = useLocaleContext();
  const placeholder = !value?.length ? rest.placeholder || t('label.selectLabels') : '';
  const labelsWrapperRef = useRef(null);
  const size = useSize(labelsWrapperRef);

  const [overflowIndex, setOverflowIndex] = useState(99999);

  useLayoutEffect(() => {
    if (compact) {
      if (labelsWrapperRef.current) {
        const { right } = labelsWrapperRef.current.getBoundingClientRect();
        const labelElements = labelsWrapperRef.current.querySelectorAll('.MuiChip-root');

        if (labelElements) {
          const overflow = Array.from(labelElements).some((x, i) => {
            const rect = x.getBoundingClientRect();
            if (rect.right > right) {
              setOverflowIndex(i);
              return true;
            }
            return false;
          });

          if (!overflow) {
            setOverflowIndex(99999);
          }
        }
      }
    } else {
      setOverflowIndex(99999);
    }
  }, [valueOptions, size, compact]);

  if (loading) return null;

  return (
    <LabelPicker
      disabled={disabled}
      value={value}
      onChange={onChange}
      multiple={multiple}
      trigger={
        <Select
          multiple={multiple}
          disabled={disabled}
          open={false}
          value={hasValue ? value : ['none']}
          size="small"
          renderValue={() => {
            if (!hasValue) {
              return <Box sx={{ color: 'text.secondary', fontSize: 14 }}>{placeholder}</Box>;
            }

            return (
              <Box sx={{ ...(compact && { height: 20 }), mt: -0.1, pr: 3 }}>
                <Box ref={labelsWrapperRef} sx={{ display: 'flex', gap: 0.5, ...(!compact && { flexWrap: 'wrap' }) }}>
                  {valueOptions.map((x, index) => {
                    const visible = index < overflowIndex;

                    return (
                      <Box key={x.data.id} sx={{ position: 'relative' }}>
                        {index === overflowIndex && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              ...(compact && { height: 20, lineHeight: '20px' }),
                              color: 'text.secondary',
                              fontWeight: 'bold',
                              fontSize: 14,
                            }}>
                            {`+${value.length - overflowIndex}`}
                          </Box>
                        )}

                        <LabelChip
                          label={x.data}
                          sx={{
                            visibility: visible ? 'visible' : 'hidden',
                            pointerEvents: visible ? 'auto' : 'none',
                          }}
                          onDelete={() => onChange(value.filter((item) => item !== x.data.id))}
                          disabled={disabled}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          }}
          sx={mergedSx}
        />
      }
      {...LabelPickerProps}
    />
  );
}

LabelsInput.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  LabelPickerProps: PropTypes.object,
  disabled: PropTypes.bool,
  sx: PropTypes.array,
  compact: PropTypes.bool,
  multiple: PropTypes.bool,
};

export default LabelsInput;
