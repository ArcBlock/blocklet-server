import { Img, Section, Text } from '@react-email/components';
import type { CSSProperties } from 'react';
import { AppInfo } from '../types';

interface HeaderProps {
  appInfo: AppInfo;
  style?: CSSProperties;
  [key: string]: any;
}

function Header({ appInfo, ...props }: HeaderProps) {
  return (
    <Section
      {...props}
      style={{
        backgroundColor: '#fff',
        ...props?.style,
      }}>
      <Text style={{ textAlign: 'center', marginBottom: 0 }}>
        <Img style={{ display: 'inline-block' }} src={appInfo.logo} height="50" alt={appInfo.title} />
      </Text>
    </Section>
  );
}

export default Header;
