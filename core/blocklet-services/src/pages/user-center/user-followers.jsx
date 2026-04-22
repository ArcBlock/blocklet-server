import { Box } from '@mui/material';
import UserFollowersComponent from '@abtnode/ux/lib/team/user-follower';
import { useUserFollowersContext } from '@blocklet/ui-react/lib/contexts/user-followers';

import useUserCenter from './use-user-center';

export default function UserFollowers() {
  const { user, isMyself, viewUser } = useUserCenter();
  const { followed } = useUserFollowersContext();

  return (
    <Box>
      <UserFollowersComponent
        teamDid={window?.blocklet?.did || ''}
        user={isMyself ? user : viewUser}
        showInvitees={isMyself}
        followed={followed}
      />
    </Box>
  );
}
