/* eslint-disable react/jsx-one-expression-per-line */
import { useContext, cloneElement } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import Button from '@mui/material/IconButton';
import { useLocation } from 'react-router-dom';

import SessionManager from '@arcblock/did-connect-react/lib/SessionManager';
import ThemeModeToggle from '@arcblock/ux/lib/Config/theme-mode-toggle';
import LocaleSelector from '@arcblock/ux/lib/Locale/selector';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import GlobeIcon from '@arcblock/icons/lib/Globe';
import QuestionMarkIcon from '@arcblock/icons/lib/QuestionMarkCircle';

export default function HeaderAddon({
  SessionContext,
  extraItems = [],
  showLocale = true,
  showHelper = true,
  showSessionManager = true,
  sessionManagerProps = {},
}) {
  const { session } = useContext(SessionContext);
  const { locale } = useContext(LocaleContext);
  const location = useLocation();

  const onHelpClick = () => {
    const pathName = location.pathname;
    if (pathName.indexOf('/store') > -1) {
      window.open('https://www.arcblock.io/content/docs/createblocklet', '_blank');
      return;
    }
    window.open('https://www.arcblock.io/content/docs/blocklet-developer', '_blank');
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-array-index-key */}
      {extraItems.map((x, index) => cloneElement(x, { key: index }))}
      {showLocale && (
        <LocaleContainer data-cy="locale-addon" icon={GlobeIcon} size={23} showText={false} className="locale-addon" />
      )}
      {/* 明暗模式切换 */}
      <ThemeModeToggle />
      {showHelper && (
        <Button onClick={onHelpClick}>
          <QuestionMarkIcon />
        </Button>
      )}
      {showSessionManager && (
        <SessionManagerContainer
          locale={locale}
          session={session}
          size={24}
          showRole
          {...sessionManagerProps}
          showManageBlocklet={false}
        />
      )}
    </>
  );
}

HeaderAddon.propTypes = {
  SessionContext: PropTypes.object.isRequired,
  extraItems: PropTypes.array,
  showLocale: PropTypes.bool,
  showSessionManager: PropTypes.bool,
  showHelper: PropTypes.bool,
  sessionManagerProps: PropTypes.object,
};

const SessionManagerContainer = styled(SessionManager)`
  .user-addon {
    .user-avatar {
      width: 28px;
      border-radius: 14px;
      height: auto;
    }
  }
`;

const LocaleContainer = styled(LocaleSelector)`
  &.locale-addon .locales {
    max-height: 400px;
    overflow-y: auto;
  }
`;
