import PropTypes from 'prop-types';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useBoolean } from 'ahooks';
import { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

import NavigationForm from './navigation-form';

export default function NavigationDialog({ ref = null, section = '', components = [], rawNavigations = [] }) {
  const { t } = useLocaleContext();
  const [show, { setTrue, setFalse }] = useBoolean(false);
  const [type, setType] = useState('add');
  const formRef = useRef(null);

  const title = useMemo(() => {
    const typeMap = {
      add: t('common.create'),
      edit: t('common.edit'),
    };

    const typeName = typeMap[type];
    if (typeName) {
      return `${typeName} ${t('navigation.navigation')}`;
    }
    return '--';
  }, [t, type]);

  const close = useCallback(() => {
    setFalse();
    formRef.current?.reset();
  }, [setFalse]);

  const add = useCallback(
    (data = {}, cb = () => {}) => {
      setType('add');
      formRef.current?.add(data, (params) => cb(close, params));
      setTrue();
    },
    [setTrue, close]
  );

  const edit = useCallback(
    (data = {}, cb = () => {}) => {
      setType('edit');
      formRef.current?.edit(data, (params) => cb(close, params));
      setTrue();
    },
    [setTrue, close]
  );

  useImperativeHandle(
    ref,
    () => ({
      add,
      edit,
      close,
    }),
    [add, edit, close]
  );

  return (
    <Dialog
      open={show}
      title={title}
      keepMounted
      onClose={close}
      sx={{ '.MuiDialogContent-root': { pt: 0 } }}
      actions={
        <Button color="primary" variant="contained" onClick={() => formRef.current?.submit()}>
          {t('common.confirm')}
        </Button>
      }>
      <NavigationForm ref={formRef} section={section} components={components} rawNavigations={rawNavigations} />
    </Dialog>
  );
}

NavigationDialog.propTypes = {
  ref: PropTypes.any,
  section: PropTypes.string,
  components: PropTypes.array,
  rawNavigations: PropTypes.array,
};
