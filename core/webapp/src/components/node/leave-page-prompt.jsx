import { useState } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import history from '../../libs/history';
import Confirm from '../confirm';

function Prompt() {
  return null;
}

export default function LeavePagePrompt({ confirm = null }) {
  const [confirmPrompt, setConfirmPrompt] = useState(null);
  const { t } = useLocaleContext();

  const onPromptDialogCancel = () => {
    setConfirmPrompt(null);
  };

  // eslint-disable-next-line require-await
  const onPromptDialogConfirm = async location => {
    if (location) {
      let prefix = window.env && window.env.apiPrefix ? window.env.apiPrefix : '/';
      if (prefix === '/') {
        history.push(`${location.pathname}`);
      } else {
        if (prefix.endsWith('/')) {
          prefix = prefix.substring(0, prefix.length - 1);
        }
        history.push(`${prefix}${location.pathname}`);
      }
      window.location.reload();
    }
  };

  const handlePrompt = (location, ...args) => {
    let settings = typeof confirm === 'function' ? confirm(location, ...args) : confirm;
    if (settings) {
      if (typeof settings === 'string') {
        settings = {
          description: settings,
        };
      }

      setConfirmPrompt({
        title: t('common.noticeTitle'),
        description: t('common.leavePageTip'),
        confirm: t('common.confirm'),
        cancel: t('common.cancel'),
        onConfirm: () => onPromptDialogConfirm(location),
        onCancel: () => onPromptDialogCancel(),
        ...settings,
      });
      return false;
    }
    return true;
  };

  return (
    <Div>
      <Prompt message={handlePrompt} />
      {confirmPrompt && (
        <Confirm
          title={confirmPrompt.title}
          description={confirmPrompt.description}
          confirm={confirmPrompt.confirm}
          cancel={confirmPrompt.cancel}
          params={confirmPrompt.params}
          onConfirm={confirmPrompt.onConfirm}
          onCancel={confirmPrompt.onCancel}
        />
      )}
    </Div>
  );
}

LeavePagePrompt.propTypes = {
  confirm: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func]),
};

const Div = styled.div`
  margin-bottom: 24px;
  .top-btns-alert {
    @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
      flex-direction: column;
      padding-bottom: 15px;
      padding-right: 20px;
    }
  }
  .top-btns-action {
    @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
      margin-right: 0px;
    }
  }
`;
