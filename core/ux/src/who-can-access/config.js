import LockIcon from '@mui/icons-material/Lock';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PublicIcon from '@mui/icons-material/Public';

import { WHO_CAN_ACCESS } from '@abtnode/constant';

export default [
  {
    value: WHO_CAN_ACCESS.ALL,
    icon: PublicIcon,
    title: {
      zh: '面向所有人',
      en: 'Open to Everyone',
    },
    description: {
      zh: '任何人都可以访问应用而不需要身份验证。',
      en: 'Anyone can access this blocklet without authenticating.',
    },
  },
  {
    value: WHO_CAN_ACCESS.INVITED,
    icon: ContactMailIcon,
    title: {
      zh: '仅限受邀',
      en: 'Invite-Only Access',
    },
    description: {
      zh: '仅限受邀用户可访问应用。',
      en: 'Only invited members can access.',
    },
  },
  {
    value: WHO_CAN_ACCESS.ADMIN,
    icon: LockPersonIcon,
    title: {
      zh: '仅限拥有者 & 管理员',
      en: 'Owner & Admin Access.',
    },
    description: {
      zh: '仅限拥有者或管理员访问应用。',
      en: 'Only the owner or an admin can access it.',
    },
  },
  {
    value: WHO_CAN_ACCESS.OWNER,
    icon: LockIcon,
    title: {
      zh: '仅限拥有者',
      en: 'Owner-Only Access',
    },
    description: {
      zh: '仅限拥有者访问应用。',
      en: 'Only the blocklet owner can access it.',
    },
  },
];
