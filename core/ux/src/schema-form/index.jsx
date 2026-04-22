import { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';

import { keyframes } from '@emotion/react';
import ColorInput from './color-input';
import TextInput from './text-input';
import PassportInput from './passport-input';

import Required from '../form/required';
import FormWrapper from '../form/form-wrapper';
import Uploader from '../blocklet/logo-uploader';
import { Accordion, AccordionSummary, AccordionDetails } from './collapse';

/**
 * 抖动动画
 */
const shakeKeyframes = keyframes`
  0%, 100% {
    transform: scale(1) translateX(0);
  }
  50% {
    transform: scale(1.05) translateX(-3px);
  }
  25%, 75% {
    transform: scale(1.1) translateX(3px);
  }
`;

const componentMap = {
  input: TextInput,
  color: ColorInput,
  passport: PassportInput,
  uploader: (props) => <Uploader {...props.componentProps} />,
};

function getComponent(item, { editing = false }) {
  const { componentType = 'input', render, renderFormItem } = item;

  // if provided renderItem and editing is true, use it
  if (editing && renderFormItem) {
    return renderFormItem;
  }

  // if provided render and editing is false, use it
  if (!editing && render) {
    return render;
  }

  return componentMap[componentType?.toLowerCase()];
}

FormItem.propTypes = {
  item: PropTypes.object.isRequired,
  findEditingItem: PropTypes.func.isRequired,
  getItemValue: PropTypes.func.isRequired,
  onFormItemChange: PropTypes.func.isRequired,
  onFocusOut: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onCancel: PropTypes.func,
  formValues: PropTypes.object.isRequired,
};

function FormItem({
  item,
  findEditingItem,
  getItemValue,
  onFormItemChange,
  onFocusOut,
  disabled = false,
  loading = false,
  onCancel = () => {},
  formValues,
}) {
  const {
    key,
    description,
    required,
    solo = false,
    hidden = false,
    componentProps = {},
    skipButtonDisabled = false,
  } = item;
  if (hidden) {
    return null;
  }
  const editingItem = findEditingItem(key);
  const { editing, shaking } = editingItem ?? {};
  const currentValue = getItemValue(item, {
    editing,
  });
  // get component by componentType
  const CurrentComponent = getComponent(item, {
    editing,
  });
  const renderComponentProps = {
    inputProps: {
      'data-cy': 'schema-form-item-component',
    },
    key,
    description,
    editing,
    value: currentValue,
    onChange: (changeValue, action = 'change') => onFormItemChange(item, changeValue, action),
    componentProps,
    skipButtonDisabled,
    onBlur: () => onFocusOut(item),
  };

  if (item.componentType === 'collapse' && item.children?.length > 0) {
    return (
      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowForwardIosSharpIcon fontSize="small" />}
          aria-controls="panel1-content"
          id="panel1-header">
          {item.description}
        </AccordionSummary>
        <AccordionDetails>
          {item.children.map((child) => {
            return (
              <FormItem
                key={child.key}
                item={child}
                findEditingItem={findEditingItem}
                getItemValue={getItemValue}
                onFormItemChange={onFormItemChange}
                onFocusOut={onFocusOut}
                formValues={formValues}
                disabled={disabled}
                loading={loading}
                onCancel={onCancel}
              />
            );
          })}
        </AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Box className="form-item" key={key}>
      {!solo && (
        <Box className="form-item-label" sx={{ color: required && !currentValue ? 'error.main' : 'text.secondary' }}>
          {description}
          {required && <Required />}
        </Box>
      )}

      <Box className="form-item-body">
        <Box
          className="form-item-input"
          data-cy="schema-form-item-edit"
          sx={{ textAlign: solo ? 'center' : 'left' }}
          style={{ cursor: 'text' }}
          onClick={() => {
            if (disabled || editingItem?.edited || skipButtonDisabled) {
              return;
            }
            onFormItemChange(item, formValues[key], 'edit');
          }}>
          <CurrentComponent {...renderComponentProps} />
        </Box>

        {!solo && (
          <Box className="form-item-action" style={{ marginLeft: 0 }}>
            {editing ? (
              <>
                {editingItem.edited ? (
                  <IconButton
                    data-cy="schema-form-item-confirm"
                    onClick={() => {
                      onFormItemChange(item, currentValue, 'confirm');
                    }}
                    disabled={disabled || loading}
                    sx={{
                      animation: shaking ? `${shakeKeyframes} 0.5s linear` : 'none',
                    }}
                    style={{ paddingRight: 4 }}
                    size="large">
                    {loading ? <CircularProgress size={24} /> : <DoneIcon />}
                  </IconButton>
                ) : null}
                <IconButton
                  data-cy="schema-form-item-cancel"
                  onClick={() => onCancel(item)}
                  style={{ paddingLeft: editingItem.edited ? 4 : 8 }}
                  disabled={disabled || loading}
                  size="large">
                  <CloseIcon />
                </IconButton>
              </>
            ) : null}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function SchemaForm({
  schema,
  loading = false,
  value = undefined,
  defaultValue = {},
  onChange,
  style = {},
  disabled = false,
}) {
  const isControlled = Object.prototype.toString.call(value) === '[object Object]';
  const [editingItems, setEditingItems] = useState([]);
  const [formValues, setFormValues] = useState(isControlled ? value : defaultValue);
  const onlyOne = useMemo(() => schema.length === 1, [schema]);
  const findEditingItem = useCallback(
    (key) => {
      return editingItems.find((v) => v.key === key);
    },
    [editingItems]
  );

  useEffect(() => {
    if (onlyOne && schema[0]?.required) {
      setEditingItems([
        {
          key: schema[0].key,
          editing: true,
          initialValue: defaultValue[schema[0].key],
        },
      ]);
    }
  }, [schema, onlyOne, defaultValue]);

  const onItemEditingStatusChange = useCallback((item) => {
    setEditingItems((prevState) => {
      const existedItem = prevState.find((v) => v.key === item.key);
      if (!existedItem) {
        return [item].concat(prevState);
      }
      return prevState.map((v) => {
        if (v.key === item.key) {
          return item;
        }
        return { ...v };
      });
    });
  }, []);

  const onFormItemChange = useCallback(
    (item, changeValue, action) => {
      const { key, secure } = item;
      const editingItem = findEditingItem(key) ?? { ...item };
      editingItem.editing = true;
      const oldValue = formValues[key];
      const isChanged = oldValue !== changeValue;
      editingItem.edited = changeValue && editingItem.initialValue !== changeValue;
      editingItem.initialValue = defaultValue[key];
      const newValues = {
        ...formValues,
        [key]: changeValue,
      };

      if (isChanged) {
        setFormValues(newValues);
      }

      onChange(
        { [key]: changeValue },
        {
          allValues: newValues,
          action,
          currentItem: item,
        }
      );
      if (action === 'confirm' && secure) {
        setFormValues({
          ...formValues,
          [key]: '__encrypted__',
        });
      }
      if (action === 'confirm') {
        editingItem.initialValue = formValues[key];
      }

      if (['confirm', 'cancel'].includes(action)) {
        editingItem.editing = false;
        editingItem.edited = false;
        onItemEditingStatusChange(editingItem);
      } else {
        onItemEditingStatusChange(editingItem);
      }
    },
    [defaultValue, formValues, onChange, onItemEditingStatusChange, findEditingItem]
  );

  const getValue = useCallback(
    (item, { editing = false }) => {
      const { key } = item;

      const currentValue = isControlled ? value[key] : formValues[key];
      if (currentValue === '__encrypted__') {
        if (!editing) {
          return '******';
        }
        return '';
      }

      return currentValue;
    },
    [isControlled, value, formValues]
  );

  const onCancel = useCallback(
    (item) => {
      const editingItem = findEditingItem(item.key);
      if (!editingItem) {
        return;
      }
      onFormItemChange(item, editingItem.initialValue, 'cancel');
    },
    [findEditingItem, onFormItemChange]
  );

  const handleShake = useCallback(
    (item) => {
      const editingItem = findEditingItem(item.key);
      if (!editingItem || !editingItem.edited) {
        return;
      }
      editingItem.shaking = true;
      // 触发按钮的抖动动画，持续 500 毫秒
      onItemEditingStatusChange(editingItem);

      // 在 500 毫秒后移除抖动动画
      setTimeout(() => {
        editingItem.shaking = false;
        onItemEditingStatusChange(editingItem);
      }, 500);
    },
    [findEditingItem, onItemEditingStatusChange]
  );

  const onFocusOut = useCallback(
    (item) => {
      const editingItem = findEditingItem(item.key);
      if (!editingItem || !editingItem.edited) {
        onCancel(item);
      } else {
        handleShake(item);
      }
    },
    [findEditingItem, handleShake, onCancel]
  );

  return (
    <StyledFormWrapper className="form" style={style}>
      {schema?.map((x) => {
        const { hidden = false } = x;
        if (hidden) {
          return null;
        }

        return (
          <FormItem
            item={x}
            findEditingItem={findEditingItem}
            getItemValue={getValue}
            onFormItemChange={onFormItemChange}
            onFocusOut={onFocusOut}
            formValues={formValues}
            disabled={disabled}
            loading={loading}
            onCancel={onCancel}
          />
        );
      })}
    </StyledFormWrapper>
  );
}

SchemaForm.propTypes = {
  schema: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object,
  defaultValue: PropTypes.object,
  style: PropTypes.object,
  disabled: PropTypes.bool,
};

const StyledFormWrapper = styled(FormWrapper)``;
