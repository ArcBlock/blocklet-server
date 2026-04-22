import { Body, Head, Html, Container } from '@react-email/components';
import { buildGoogleFontsImportFromMultiple } from '../_libs/google-fonts';
import type { EmailTheme } from '../types';

function Layout({
  children,
  mainStyle = {},
  containerStyle = {},
  subject,
  theme,
}: {
  children: any;
  mainStyle?: object;
  containerStyle?: object;
  subject: string;
  theme?: EmailTheme;
}) {
  const fontFamily = theme?.typography?.fontFamily;
  const headingFontFamily = theme?.typography?.h1?.fontFamily;
  const googleFontsImport = buildGoogleFontsImportFromMultiple([fontFamily, headingFontFamily]);

  return (
    <Html>
      <Head>
        {subject && <title>{subject}</title>}
        {googleFontsImport && <style>{googleFontsImport}</style>}
      </Head>
      <Body style={{ ..._mainStyle, ...mainStyle }}>
        <div style={{ ..._mainStyle, ...mainStyle }}>
          <div style={{ padding: '0 10px 20px 10px' }}>
            <Container style={{ ..._containerStyle, ...containerStyle }}>
              <div>{children}</div>
            </Container>
          </div>
        </div>
      </Body>
    </Html>
  );
}

export default Layout;

const _mainStyle = {
  backgroundColor: '#f2f2f2',
};
const _containerStyle = {
  margin: '0 auto',
  maxWidth: '50em',
};
