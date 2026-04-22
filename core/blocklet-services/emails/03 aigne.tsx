import NotificationEmail from './_templates/notification';

export default function Aigne() {
  const locale = 'en';
  const zh = {
    title: '你收到一个课程结业证书',
    body: '感谢完成课程，这是你的证书',
    attachments: [
      {
        type: 'image',
        data: {
          url: 'https://staging.aigne.io/blender/api/templates/preview/vEElhEOwsy2ST_6jNyiUX-3?sn=464982&dynamicData=%7B%22instructor%22:%22ArcBlock%22,%22certificateName%22:%22hello%22,%22userName%22:%22world%22%7D',
          alt: 'Passport Display',
        },
      },
    ],
  };
  const en = {
    title: 'You just received a course completion certificate',
    body: 'Thanks for completing the course, here is your certificate.',
    attachments: [
      {
        type: 'image',
        data: {
          url: 'https://staging.aigne.io/blender/api/templates/preview/vEElhEOwsy2ST_6jNyiUX-3?sn=464982&dynamicData=%7B%22instructor%22:%22ArcBlock%22,%22certificateName%22:%22hello%22,%22userName%22:%22world%22%7D',
          alt: 'Passport Display',
        },
      },
    ],
  };

  const appInfo = {
    title: 'ArcBlock Online Exam',
    logo: 'https://picsum.photos/id/4/200/100',
    url: 'https://staging.aigne.io/ai-studio/apps/504479224665473024',
    description: 'A blocklet generates by AIGNE',
    version: '1.0.0',
  };

  const lang = { zh, en }[locale];

  const userInfo = {
    email: 'blocklet@arcblock.io',
  };

  return (
    <NotificationEmail
      title={lang.title}
      body={lang.body}
      attachments={lang.attachments}
      appInfo={appInfo}
      subject={`[${appInfo.title}] ${lang.title}`}
      locale={locale}
      userInfo={userInfo}
      severity="success"
      poweredBy={{
        name: 'AIGNE',
        url: 'https://aigne.io/',
      }}
    />
  );
}
