import { Img } from '@react-email/components';

function DAPP({
  data,
}: {
  data: {
    url: string;
    appDID: string;
    logo: string;
    title: string;
    desc?: string;
  };
}) {
  return (
    <a
      href={data.url}
      target="_blank"
      style={{
        display: 'flex',
        textDecoration: 'none',
        color: 'initial',
        margin: '1em 0',
      }}>
      <Img src={data.logo} width={50} height={50} />
      <div style={{ flex: 1, marginLeft: '10px' }}>
        <div style={{ marginBottom: '6px' }}>{data.title}</div>
        <div style={{ color: '#a5a5a5', fontSize: '0.8em' }}>{data.appDID}</div>
      </div>
    </a>
  );
}

export default DAPP;
