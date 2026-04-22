import { Text } from '@react-email/components';
// @ts-ignore
import { COPYRIGHT_OWNER } from '@abtnode/constant';

const startYear = 2017;
const endYear = new Date().getFullYear();

function Copyright() {
  return (
    <Text
      style={{
        textAlign: 'center',
        color: '#898989',
        fontSize: 12,
        margin: 0,
      }}>
      © {startYear}-{endYear} {COPYRIGHT_OWNER} All Rights Reserved.
    </Text>
  );
}

export default Copyright;
