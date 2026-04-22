/* eslint-disable react/require-default-props */
import { Box, Card, CardContent, Collapse } from '@mui/material';
import { useCreation, useMemoizedFn, useReactive } from 'ahooks';
import { Icon } from '@iconify/react';
import expandMoreIcon from '@iconify-icons/material-symbols/expand-more';
import isUndefined from 'lodash/isUndefined';
import PropTypes from 'prop-types';

export default function BlockletSecurityCollapse({
  title,
  actions,
  children = null,
  defaultValue = true,
  value,
  onChange,
  showExpand = true,
}) {
  const isControlled = !isUndefined(value);
  const currentState = useReactive({
    open: defaultValue,
  });

  const showOpen = useCreation(() => {
    if (isControlled) {
      return value;
    }
    return currentState.open;
  }, [value, isControlled, currentState.open]);

  const handleChange = useMemoizedFn(() => {
    if (isControlled) {
      onChange(!showOpen);
    } else {
      currentState.open = !currentState.open;
    }
  });

  return (
    <Card variant="outlined">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          px: 2,
          py: 1,
          backgroundColor: 'grey.50',
        }}
        onClick={handleChange}>
        <Box sx={{ fontWeight: 'bold' }}>{title}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {actions}
          {showExpand ? (
            <Box
              component={Icon}
              icon={expandMoreIcon}
              sx={{
                transform: showOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                fontSize: '2rem',
              }}
            />
          ) : null}
        </Box>
      </Box>
      <Collapse in={showOpen}>
        <CardContent>{children}</CardContent>
      </Collapse>
    </Card>
  );
}

BlockletSecurityCollapse.propTypes = {
  title: PropTypes.string.isRequired,
  defaultValue: PropTypes.bool,
  value: PropTypes.bool,
  actions: PropTypes.node,
  children: PropTypes.node,
  onChange: PropTypes.func,
  showExpand: PropTypes.bool,
};
