import NotificationEmail from './_templates/notification';

export default function Launcher() {
  const locale = 'en';
  const zh = {
    title: '节点创建成功',
    body: '您的节点 Blocklet Space(zNKcdNoYGDYEZMLC9UfLKtyFWurpdz5JJhWS) 正在运行。',
    attachments: [
      {
        type: 'asset',
        data: {
          chainHost: 'https://beta.abtnetwork.io/api/',
          did: 'zjdqaYjk2zK9DqUjtTFnaag2cRXGFFD5n12X',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'text',
            data: { type: 'plain', color: '#9397A1', text: '服务器 ID' },
          },
          {
            type: 'text',
            data: { type: 'plain', text: 'zNKcdNoYGDYEZMLC9UfLKtyFWurpdz5JJhWS' },
          },
          {
            type: 'text',
            data: { type: 'plain', color: '#9397A1', text: '服务器名称' },
          },
          { type: 'text', data: { type: 'plain', text: 'Blocklet Space' } },
        ],
      },
    ],
    actions: [
      {
        name: '管理节点',
        link: 'http://192.168.0.10:3030/instanceurl?assetId=zjdueJQh3jkfXHMHcX4BHpM8PZ3GGKu7W2bj',
      },
    ],
  };
  const en = {
    title: 'Blocklet Server is up and running',
    body: 'Your Blocklet Server Blocklet Space(zNKcdNoYGDYEZMLC9UfLKtyFWurpdz5JJhWS) is up and running.',
    attachments: [
      {
        type: 'asset',
        data: {
          chainHost: 'https://beta.abtnetwork.io/api/',
          did: 'zjdqaYjk2zK9DqUjtTFnaag2cRXGFFD5n12X',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'text',
            data: { type: 'plain', color: '#9397A1', text: 'Server ID' },
          },
          {
            type: 'text',
            data: { type: 'plain', text: 'zNKcdNoYGDYEZMLC9UfLKtyFWurpdz5JJhWS' },
          },
          {
            type: 'text',
            data: { type: 'plain', color: '#9397A1', text: 'Server Name' },
          },
          { type: 'text', data: { type: 'plain', text: 'Blocklet Space' } },
        ],
      },
    ],
    actions: [
      {
        name: 'Manage Server',
        link: 'http://192.168.0.10:3030/instanceurl?assetId=zjdueJQh3jkfXHMHcX4BHpM8PZ3GGKu7W2bj',
      },
    ],
  };

  const appInfo = {
    title: 'Server Launcher',
    logo: 'https://example.com/logo.svg',
    url: 'https://example.com/',
    description: 'A blocklet that helps you manage Blocklet Server and serverless dApps',
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
      actions={lang.actions}
      appInfo={appInfo}
      subject={`[${appInfo.title}] ${lang.title}`}
      locale={locale}
      userInfo={userInfo}
    />
  );
}
