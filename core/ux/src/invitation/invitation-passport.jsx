/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/alt-text */
import { useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Dialog from '@arcblock/ux/lib/Dialog';
import NFTDisplay from '@arcblock/ux/lib/NFTDisplay';
import { Inbox } from '@mui/icons-material';
import dayjs from '@abtnode/util/lib/dayjs';

function InvitationPassport({ invitation, createPassportSvg, passportColor = 'auto' }) {
  const [open, setOpen] = useState(false);
  const { t } = useContext(LocaleContext);

  const roleName = useMemo(() => {
    const roleRaw = invitation.role.title || invitation.role.name;
    return roleRaw.toUpperCase();
  }, [invitation.role.title, invitation.role.name]);

  const display = useMemo(() => {
    return createPassportSvg({
      title: roleName,
      issuer: invitation.info.name,
      issuerDid: invitation.info.appDid,
      ownerName: 'Your Name',
      // can't get avatar, cause user is not login
      // ownerAvatarUrl: user.avatar,
      ownerDid: invitation.info.appDid,
      preferredColor: invitation.info.passportColor || passportColor,
      extra: invitation.passportExpireTime
        ? {
            key: 'Exp',
            value: dayjs(invitation.passportExpireTime).format('YYYY-MM-DD HH:mm:ss'),
          }
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitation, roleName]);

  const onViewPermission = useCallback(() => {
    setOpen(true);
  }, []);
  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <Root>
        <div className="invite-passport__card" onClick={onViewPermission}>
          {!!invitation.display && <NFTDisplay data={invitation.display} style={{ width: '100%', height: '100%' }} />}
          {!invitation.display && (
            <div className="invite-passport__cover" dangerouslySetInnerHTML={{ __html: display }} />
          )}
        </div>
      </Root>

      <Dialog
        open={open}
        title={t('invite.viewPermission')}
        PaperProps={{
          style: {
            minHeight: 'auto',
            paddingBottom: '20px',
          },
        }}
        onClose={onClose}>
        {invitation.role.permissions && invitation.role.permissions.length > 0 ? (
          <ul style={{ listStyle: 'circle', padding: '0 20px' }}>
            {invitation.role.permissions.map((item) => (
              <li key={item.name} style={{ listStyle: 'circle' }}>
                {item.description}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#999', textAlign: 'center' }}>
            <Inbox style={{ width: '30px', height: '30px' }} />
            <div>{t('invite.emptyPermission')}</div>
          </div>
        )}
      </Dialog>
    </>
  );
}

InvitationPassport.propTypes = {
  invitation: PropTypes.object.isRequired,
  createPassportSvg: PropTypes.func.isRequired,
  passportColor: PropTypes.string,
};

const Root = styled.div`
  display: flex;
  max-width: 350px;
  margin: 30px auto;
  .invite-passport__card {
    margin: 0 auto;
    width: 228px;
    height: 258px;
    flex-shrink: 0;
    .invite-passport__cover {
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
  }
  .invite-passport__content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .invite-passport__title {
    font-weight: 700;
    font-size: 16px;
  }
  .invite-passport__description {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    height: 3em;
    color: #999;
    font-size: 14px;
  }
  .invite-passport__view-permission {
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export default InvitationPassport;
