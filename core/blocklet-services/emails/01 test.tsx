import NotificationEmail from './_templates/notification';

export default function Test() {
  const title = 'Head for blocklet email demo';
  const body =
    'User <DAMINGZHAO(did:abt:z1Y313EXfBK9FePjDh5cZy6sNY97TneEemB)> has a <Transaction(tx:beta:D20C566BB46A7B6B4DDEA0B42EB3996F0213C1C27C54533F3D40D7B5C6DA59FD)> and it will give your a <Badge (nft:beta:zjdivheWGgy6ucvsYYqP34hVeUgx6743GEfx)> on the DApp <OCAP Playground(dapp:beta:zNKeLKixvCM32TkVM1zmRDdAU3bvm3dTtAcM)>';
  const attachments = [
    {
      type: 'token',
      data: {
        address: 'z35n6UoHSi9MED4uaQy6ozFgKPaZj2UKrurBG',
        decimal: 18,
        amount: 10000,
        chainId: 'beta',
        symbol: 'TBA',
      },
    },
    {
      type: 'asset',
      data: {
        chainHost: 'https://beta.abtnetwork.io/api/',
        did: 'zjdivheWGgy6ucvsYYqP34hVeUgx6743GEfx',
      },
    },
    // {
    //   type: 'vc',
    //   data: {
    //     credential: '',
    //     tag: '',
    //   },
    // },
    {
      type: 'text',
      data: {
        type: 'plain',
        text: `哈哈哈哈哈
        换行测试`,
        color: 'red',
      },
    },
    {
      type: 'image',
      data: {
        url: 'https://picsum.photos/100/100',
        alt: 'beta',
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'transaction',
      data: {
        hash: 'asdasdasasd',
        chainId: 'beta',
      },
    },
    {
      type: 'dapp',
      data: {
        url: 'https://my-blocklet-1-2-3-4.ip.abtnet.io/',
        appDID: 'zNKuEeFscqBDfaS5RMrmFKdQmucpcQkPEJgi',
        logo: 'https://picsum.photos/50/50',
        title: 'Token Prize',
        desc: '奖金池开启，速来瓜分🏃🏻🏃🏻🏃🏻~\n[测试] 使用 DID Wallet + Twitter 账户即可参与奖池瓜分，更有机会直接赢走 50% 奖池数额，快来参加吧！！！',
      },
    },
    {
      type: 'link',
      data: {
        url: 'https://my-blocklet-1-2-3-4.ip.abtnet.io/',
        image: 'https://picsum.photos/50/50',
        title: 'Token Prize',
        description:
          '奖金池开启，速来瓜分🏃🏻🏃🏻🏃🏻~\n[测试] 使用 DID Wallet + Twitter 账户即可参与奖池瓜分，更有机会直接赢走 50% 奖池数额，快来参加吧！！！',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'text',
          data: {
            type: 'plain',
            color: '#9397A1',
            text: '当前余额',
          },
        },
        {
          type: 'text',
          data: {
            type: 'plain',
            color: '#DE9E37',
            text: '+ 100 ABT',
          },
        },
        {
          type: 'text',
          data: {
            type: 'plain',
            color: '#9397A1',
            text: '扣费日期',
          },
        },
        {
          type: 'text',
          data: {
            type: 'plain',
            text: '2023年1月3日 上午8:00',
          },
        },
        {
          type: 'text',
          data: {
            type: 'plain',
            color: '#9397A1',
            text: '下月扣除',
          },
        },
        {
          type: 'text',
          data: {
            type: 'plain',
            text: '200 ABT',
          },
        },
        {
          type: 'text',
          data: {
            type: 'plain',
            color: '#9397A1',
            text: '本月支出',
          },
        },
        {
          type: 'text',
          data: {
            type: 'plain',
            text: '-200 ABT',
          },
        },
      ],
    },
  ];
  const actions = [
    {
      name: 'Launch',
      url: '',
    },
    {
      name: 'Dashboard',
      url: '',
    },
  ];

  const appInfo = {
    title: 'Blocklet Email Demo',
    logo: 'https://picsum.photos/200/100',
    url: 'https://www.arcblock.io',
    description: 'This is a demo blocklet for email test only',
    version: '1.0.0',
  };

  const userInfo = {
    // avatar: 'https://www.dute.org/placeholder/100x100',
    did: 'z1Y313EXfBK9FePjDh5cZy6sNY97TneEemB',
    fullName: 'BlockletBot',
    email: 'blocklet@arcblock.io',
  };

  return (
    <NotificationEmail
      title={title}
      body={body}
      attachments={attachments}
      actions={actions}
      appInfo={appInfo}
      subject={`[${appInfo.title}] ${title}`}
      locale="zh"
      severity="error"
      unsubscribeToken="token"
      userInfo={userInfo}
    />
  );
}
