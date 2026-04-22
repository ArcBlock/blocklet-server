import { useCreation, useRequest } from 'ahooks';
import { getQuery } from 'ufo';
import pWaitFor from 'p-wait-for';
import { ROLES } from '@abtnode/constant';

import { useSessionContext } from '../../contexts/session';
import { sdkClient } from '../../util';

export default function useUserCenter(props) {
  const { userDid = '' } = props || {};
  const { session } = useSessionContext();

  const currentDid = useCreation(() => {
    if (userDid) {
      return userDid;
    }

    const currentUrl = window.location.href;
    const query = getQuery(currentUrl);
    if (query?.did) {
      if (Array.isArray(query.did)) {
        return query.did[0];
      }
      return query.did;
    }
    return session?.user?.did;
  }, [session?.user?.did, userDid]);

  const user = useCreation(() => {
    return session.user;
  }, [session]);

  const isMyself = useCreation(() => {
    if (user) {
      return currentDid === user?.did;
    }
    return false;
  }, [currentDid, user?.did]);

  const userState = useRequest(
    // eslint-disable-next-line consistent-return
    async () => {
      await pWaitFor(() => session?.initialized);
      if (isMyself) {
        return session.user;
      }
      if (currentDid) {
        return sdkClient.user.getUserPublicInfo({ did: currentDid });
      }
    },
    {
      refreshDeps: [currentDid, isMyself, session?.initialized, user],
    }
  );

  const isOwner = useCreation(() => {
    return user?.passports?.some((x) => x.role === ROLES.OWNER);
  }, [user]);

  return {
    currentDid,
    session,
    isMyself,
    user,
    viewUser: userState.data,
    isOwner,
  };
}
