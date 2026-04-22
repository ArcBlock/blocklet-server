import { Img, Text } from '@react-email/components';
import { getUrlHost } from '../_libs/chain';

function Article({
  data,
}: {
  data: {
    url: string;
    title: string;
    description?: string;
    image?: string;
  };
}) {
  const host = getUrlHost(data.url);
  return (
    <a
      href={data.url}
      target="_blank"
      style={{
        textDecoration: 'none',
        color: 'initial',
        margin: '1em 0',
        display: 'block',
      }}>
      <div
        style={{
          color: '#a5a5a5',
          fontSize: '0.8em',
        }}>
        {host}
      </div>
      <Text
        style={{
          margin: 0,
          color: '#4598fa',
          whiteSpace: 'pre-line!important' as 'pre-line',
        }}>
        {data.title}
      </Text>
      {data.description && (
        <Text
          style={{
            margin: 0,
            whiteSpace: 'pre-line!important' as 'pre-line',
          }}>
          {data.description}
        </Text>
      )}
      {data.image && (
        <Img
          src={data.image}
          style={{
            width: '100%',
            height: '150px',
            objectFit: 'contain',
            objectPosition: 'left',
          }}
        />
      )}
    </a>
  );
}

export default Article;
