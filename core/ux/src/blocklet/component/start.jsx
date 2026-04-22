import { useState, useContext } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Toast from '@arcblock/ux/lib/Toast';

import StartIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import Confirm from '../../confirm';

export default function StartComponent({
  component,
  onStart = async () => {},
  onStop = async () => {},
  disabled = false,
  tip = '',
}) {
  const { t } = useContext(LocaleContext);
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState();

  const startComponent = async () => {
    setLoading(true);
    try {
      await onStart(component);
    } catch (error) {
      Toast.error(error.message);
    }
    setLoading(false);
  };

  const stopComponent = async () => {
    setLoading(true);
    try {
      await onStop(component);
    } catch (error) {
      Toast.error(error.message);
    }
    setLoading(false);
  };

  const componentDisabled = disabled || loading;

  const stoppingStatus = ['starting', 'running', 'stopping'];

  const isStop = stoppingStatus.includes(component.status) || stoppingStatus.includes(component.greenStatus);

  const Icon = isStop ? StopIcon : StartIcon;

  const btn = (
    <StyledButton
      disabled={componentDisabled}
      size="small"
      onClick={() => {
        if (isStop) {
          setConfirmSetting({
            title: `${t('common.stop')} ${component?.meta?.title}`,
            description: t('blocklet.action.stopComponentDescription'),
            confirm: t('blocklet.action.confirmStop'),
            cancel: t('common.cancel'),
            onConfirm: () => {
              setConfirmSetting(null);
              return stopComponent();
            },
            onCancel: () => setConfirmSetting(null),
          });
        } else {
          startComponent();
        }
      }}
      data-cy={`${isStop ? 'stop' : 'start'}-component-btn`}>
      <Icon disabled={componentDisabled} fontSize="small" />
    </StyledButton>
  );

  return [
    <Tooltip key="btn" title={tip || t(`common.${isStop ? 'stop' : 'start'}`)}>
      <span>{btn}</span>
    </Tooltip>,
    confirmSetting && (
      <Confirm
        key="connect"
        title={confirmSetting.title}
        description={confirmSetting.description}
        confirm={confirmSetting.confirm}
        cancel={confirmSetting.cancel}
        params={confirmSetting.params}
        onConfirm={confirmSetting.onConfirm}
        onCancel={confirmSetting.onCancel}
      />
    ),
  ];
}

StartComponent.propTypes = {
  component: PropTypes.object.isRequired,
  onStart: PropTypes.func,
  onStop: PropTypes.func,
  disabled: PropTypes.bool,
  tip: PropTypes.string,
};

const StyledButton = styled(IconButton)`
  &.Mui-disabled {
    opacity: 0.5;
  }
`;
