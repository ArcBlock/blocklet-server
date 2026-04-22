export const DEFAULT_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

export const getLinkStyle = (fontFamily = DEFAULT_FONT_FAMILY) => ({
  color: '#2754C5',
  fontFamily,
  fontSize: '14px',
  textDecoration: 'underline',
});

export const linkStyle = getLinkStyle();

export const actionsStyle = {
  margin: '20px -8px 0px',
};

export const actionStyle = {
  color: '#4598fa',
  fontSize: 14,
  border: '1px solid #4598fa',
  display: 'inline-block',
  borderRadius: '4px',
  margin: '8px',
  marginTop: '8px',
  marginBottom: '8px',
  marginLeft: '8px',
  marginRight: '8px',
};

export const assetStyle = {
  backgroundColor: '#f6f6f6',
  borderRadius: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '12px',
  paddingBottom: '12px',
  margin: '1em 0',
};

export const remarkStyle = {
  color: '#9397a1',
  fontSize: '12px',
  margin: 0,
  whiteSpace: 'pre-line!important' as 'pre-line',
};

export const summaryStyle = {
  color: '#49c3ad',
};

export const titleStyle = {
  marginBottom: '6px',
};

export const severityColorMap = {
  normal: '#C4C5CA',
  success: '#25C99B',
  error: '#F16E6E',
  warning: '#DE9E37',
};

export const attachmentsStyle = {
  borderLeft: '2px solid transparent',
  paddingLeft: '20px',
};

export const getH1Style = (fontFamily = DEFAULT_FONT_FAMILY) => ({
  color: '#333',
  fontFamily,
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '1em 0',
  padding: '0',
});

export const h1Style = getH1Style();

export const getFooterStyle = (fontFamily = DEFAULT_FONT_FAMILY) => ({
  color: '#898989',
  fontFamily,
  fontSize: '12px',
  lineHeight: '22px',
  margin: 0,
  textAlign: 'center' as 'center',
});

export const footerStyle = getFooterStyle();

export const contentStyle = {
  margin: '0 auto 20px auto',
  backgroundColor: '#ffffff',
  padding: '10px 20px 30px 20px',
};
