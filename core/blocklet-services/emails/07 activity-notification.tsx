import ActivityNotificationEmail from './_templates/activity-notification';

export function ActivityNotification() {
  const notification = {
    id: 'c8aecaa3-977a-4d39-aac0-818a72a738ee',
    title: 'Merged Notification Read',
    attachments: [
      {
        type: 'link',
        data: {
          url: 'https://example.did.abtnet.io/discuss-kit/discussions/a6a8a7ef-92ec-4267-948b-de0ace2295fc/#b7c351f4-38be-427b-a53c-018663d2b70e',
          title: 'Merged Notification Read',
          description: 'teamDid',
        },
      },
    ],
    type: 'notification',
    activity: {
      type: 'comment',
      actor: 'z1TZWQFZ6rsoHbty2obQsRuGbfwLya1Wf7h',
      target: {
        id: 'https://example.did.abtnet.io/discuss-kit/discussions/a6a8a7ef-92ec-4267-948b-de0ace2295fc',
        name: 'Merged Notification Read',
        desc: '',
        image: '',
        type: 'discussion',
      },
      meta: {
        id: 'https://example.did.abtnet.io/discuss-kit/discussions/a6a8a7ef-92ec-4267-948b-de0ace2295fc/#b7c351f4-38be-427b-a53c-018663d2b70e',
        content: 'teamDid',
      },
    },
    body: '<lius(did:abt:z1TZWQFZ6rsoHbty2obQsRuGbfwLya1Wf7h)> commented on your post',
    severity: 'normal',
    createdAt: '2025-05-07T06:26:25.183Z',
    sender: {
      did: 'zNKdnWAEwXYydvJ3dnGhfMEqzmQTPsSWwxTp',
      name: 'Wallet Playground',
      logo: 'https://example.did.abtnet.io/.well-known/service/blocklet/logo?imageFilter=convert&f=png&h=80',
      actualDid: 'zNKdnWAEwXYydvJ3dnGhfMEqzmQTPsSWwxTp',
    },
    actorInfo: {
      did: 'z1TZWQFZ6rsoHbty2obQsRuGbfwLya1Wf7h',
      fullName: 'lius',
      avatar: 'bn://avatar/8985e77e4f0b749b5a29b55d2f4c4045.png',
    },
    actions: [],
  };

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

  const siteDomain = 'example.did.abtnet.io';
  const signatureConfig = {
    companyAddress: '1567 Highlands Dr. NE #110-30 Issaquah, WA 98029',
    companyLink: 'https://arcblock.io/en',
    companyName: 'ArcBlock Inc',
    supportEmail: 'support@arcblock.io',
  };

  return (
    <ActivityNotificationEmail
      title={notification.title}
      body={notification.body}
      attachments={notification.attachments}
      activity={notification.activity}
      actor={notification.actorInfo}
      actions={notification.actions}
      appInfo={appInfo}
      subject={`[${appInfo.title}] ${notification.title}`}
      siteDomain={siteDomain}
      locale="en"
      severity="normal"
      unsubscribeToken="token"
      userInfo={userInfo}
      signatureConfig={signatureConfig}
    />
  );
}

export default ActivityNotification;
