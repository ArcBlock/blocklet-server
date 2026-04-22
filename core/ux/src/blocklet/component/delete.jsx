import { useState, useContext, useEffect } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import DeleteIcon from '@mui/icons-material/Delete';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import Confirm from '../../confirm';

export default function DeleteComponent({
  component,
  remove = async () => {},
  disabled = false,
  tip = '',
  showConfirm = false,
  hideBtn = false,
  onCancel = () => {},
}) {
  const { t } = useContext(LocaleContext);
  const [loading, setLoading] = useState(false);
  const [deleteSetting, setDeleteSetting] = useState(null);

  const deleteComponent = async (param) => {
    setLoading(true);
    await remove(param.component, param.removeType);
    setLoading(false);
    setDeleteSetting(null);
  };

  const componentDisabled = disabled || loading;

  const doShowConfirm = () => {
    setDeleteSetting({
      title: `${t('common.delete')} ${component.meta.title || component.meta.name}`,
      // eslint-disable-next-line react/no-unstable-nested-components
      description: (params, setParams) => (
        <Typography component="div">
          <Typography gutterBottom>{t('blocklet.action.removeComponentDescription')}</Typography>
          <RadioGroup
            name="removeType"
            value={params.removeType}
            onChange={(e) => setParams({ ...params, removeType: e.target.value })}>
            <FormControlLabel
              value="keepData"
              control={<Radio />}
              label={t('blocklet.action.removeComponentKeepData')}
            />
            <FormControlLabel
              value="complete"
              control={<Radio />}
              label={t('blocklet.action.removeComponentComplete')}
            />
          </RadioGroup>
        </Typography>
      ),
      confirm: t('common.confirm'),
      cancel: t('common.cancel'),
      params: { component, removeType: 'keepData' },
      onConfirm: deleteComponent,
      onCancel: () => {
        setDeleteSetting(null);
        onCancel();
      },
    });
  };

  useEffect(() => {
    if (showConfirm) {
      doShowConfirm();
    } else {
      setLoading(false);
      setDeleteSetting(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfirm]);

  const btn = (
    <StyledButton
      size="small"
      disabled={componentDisabled}
      onClick={() => doShowConfirm}
      data-cy="delete-component-btn">
      <DeleteIcon disabled={componentDisabled} />
    </StyledButton>
  );

  const btnWithToolTip = (
    <Tooltip title={tip || t('common.delete')}>
      <span>{btn}</span>
    </Tooltip>
  );

  return (
    <>
      {!hideBtn && btnWithToolTip}
      {deleteSetting && (
        <Confirm
          title={deleteSetting.title}
          description={deleteSetting.description}
          confirm={deleteSetting.confirm}
          cancel={deleteSetting.cancel}
          params={deleteSetting.params}
          onConfirm={deleteSetting.onConfirm}
          onCancel={deleteSetting.onCancel}
        />
      )}
    </>
  );
}

DeleteComponent.propTypes = {
  component: PropTypes.object.isRequired,
  remove: PropTypes.func,
  onCancel: PropTypes.func,
  disabled: PropTypes.bool,
  showConfirm: PropTypes.bool,
  hideBtn: PropTypes.bool,
  tip: PropTypes.string,
};

const StyledButton = styled(IconButton)`
  &.Mui-disabled {
    opacity: 0.5;
  }
`;
