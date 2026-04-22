import { Link, Text } from '@react-email/components';
import { PoweredBy as IPoweredBy } from '../types';
import { getLinkStyle } from '../_libs/style';

function PoweredBy(props: IPoweredBy & { fontFamily?: string }) {
  const linkStyle = getLinkStyle(props.fontFamily);
  const content = props.url ? (
    <Link href={props.url} target="_blank" style={{ ...linkStyle, color: '#898989' }}>
      {props.name}
    </Link>
  ) : (
    props.name
  );
  return (
    <Text
      style={{
        textAlign: 'center',
        color: '#898989',
        fontSize: 12,
        margin: 0,
      }}>
      Powered by {content}
    </Text>
  );
}

export default PoweredBy;
