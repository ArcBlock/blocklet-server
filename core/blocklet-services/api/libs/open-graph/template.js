const { getTextColor } = require('@abtnode/auth/lib/util/create-passport-svg');

// Join the raw strings and values to reconstruct the original string
const join = (strings, ...values) => {
  const original = strings.raw.reduce((result, str, i) => {
    return result + str + (values[i] !== undefined ? values[i] : '');
  }, '');

  return original;
};

const getLogoSvg = (color) => {
  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  style="position: absolute; right: 24px; bottom: 24px; opacity: 0.1"
  width="360"
  height="416"
  viewBox="0 0 45 52"
>
  <g fill="none" fill-rule="evenodd" stroke="${color}">
    <path
      d="M.5 13.077L22.15.577l21.651 12.5v25l-21.65 12.5L.5 38.077zM22.15.577v50M.5 13.077l43.301 25m-43.301 0l43.301-25"
    ></path>
    <path d="M22.15 38.077l10.826-6.25-10.825-18.75-10.825 18.75z"></path>
  </g>
</svg>`;
};

const getDefaultTemplate = ({ width, height, logo, background, logoRounded, title, description }, fn) => {
  return fn`<div
    style="
    width: ${width}px;
    height: ${height}px;
    background-image: url(${background});
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    position: relative;
  "
  >
    <img
      src="${logo}"
      height="90"
      width="90"
      style="margin-left: 96px; height: 90px; width: 90px;${logoRounded ? 'border-radius: 50%;' : ''} margin-bottom: 64px"
    />
    <h2
      style="
      font-size: 48px;
      letter-spacing: -2px;
      margin: 0 0 32px;
      color: #EEE;
      font-weight: 500;
      font-family: Arial, sans-serif;
      text-align: left;
      padding: 0 96px;
    "
    >
      ${title}
    </h2>
    <h3
      style="
      font-size: 2rem;
      margin: 0;
      color: #EEE;
      opacity: 0.7;
      font-weight: 400;
      font-family: Arial, sans-serif;
      text-align: left;
      padding: 0 96px;
      line-clamp: 3;
    "
    >
      ${description}
    </h3>
  </div>`;
};

const getSectionTemplate = (
  { width, height, logo, logoRounded, background, color, title, description, section },
  fn
) => {
  return fn`<div
    style="
    width: ${width}px;
    height: ${height}px;
    background-image: url(${background});
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    position: relative;
  "
  >
    <img
      src="${logo}"
      height="90"
      width="90"
      style="margin-left: 96px; height: 90px; width: 90px; ${logoRounded ? 'border-radius: 50%;' : ''} margin-bottom: 64px"
    />
    <p
      style="
      font-size: 1.5rem;
      margin: 0;
      color: ${color.start};
      font-weight: 400;
      font-family: Arial, sans-serif;
      text-align: left;
      text-transform: uppercase;
      padding: 0 96px;
    "
    >
      ${section}
    </p>
    <h2
      style="
      font-size: 48px;
      margin: 0 0 32px;
      color: #EEE;
      letter-spacing: -2px;
      font-weight: 500;
      font-family: Arial, sans-serif;
      text-align: left;
      padding: 0 96px;
      line-clamp: 2;
    "
    >
      ${title}
    </h2>
    <h3
      style="
      font-size: 2rem;
      margin: 0;
      color: #EEE;
      opacity: 0.7;
      font-weight: 400;
      font-family: Arial, sans-serif;
      text-align: left;
      padding: 0 96px;
      line-clamp: 3;
    "
    >
      ${description}
    </h3>
  </div>`;
};

const getCoverTemplate = ({ width, height, logo, logoRounded, color, title, description, cover }, fn) => {
  const textColor = getTextColor(color.start);
  return fn`<div style="width: ${width}px; height: ${height}px; display: flex; background: ${color.start};">
    <div style="display: flex; height: ${height}px; background: ${color.start}; width: 45%">
      <div style="margin-left: 32px; display: flex; flex-direction: column; align-items: flex-start; justify-content: space-around;">
        <h2
          style="
          font-size: 3rem;
          color: ${textColor};
          font-weight: 400;
          font-family: Arial, sans-serif;
          margin: 32px 32px 0 0;
          text-align: left;
        "
        >
          ${description}
        </h2>
        <div style="display: flex; justify-content: flex-start; align-items: center">
          <img src="${logo}" height="60" width="60" style="height: 60px; width: 60px; ${logoRounded ? 'border-radius: 50%;' : ''}" />
          <h3
            style="
            font-size: 2rem;
            margin: 0 0 0 16px;
            color: ${textColor};
            font-weight: 400;
            font-family: Arial, sans-serif;
            text-align: left;
            text-transform: capitalize;
          "
          >
            ${title}
          </h3>
        </div>
      </div>
    </div>
    <div style="display: flex; height: 630px; width: 55%; background-color: ${color.start}">
      <img src="${cover}" height="630" width="100%" style="height: 630px; width: 100%; object-fit: cover" />
      <div style="
        display: flex;
        background: ${color.start};
        height: ${height * 2}px;
        width: 100px;
        position: absolute;
        transform: rotate(8deg);
        left: -90px;
        top: -25px;"></div>
    </div>
  </div>`;
};

const getBannerTemplate = ({ width, height, logo, logoRounded, background, title }, fn) => {
  return fn`<div
    style="
    width: ${width}px;
    height: ${height}px;
    background-image: url(${background});
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    position: relative;
  "
  >
    <img
      src="${logo}"
      height="150"
      width="150"
      style="height: 150px; width: 150px; ${logoRounded ? 'border-radius: 50%;' : ''} margin-right: 48px"
    />
    <h2
      style="
      font-size: 72px;
      color: #eee;
      font-weight: 500;
      font-family: Arial, sans-serif;
      text-align: left;
      line-clamp: 1;
    "
    >
      ${title}
    </h2>
  </div>`;
};

const getTemplate = async (params) => {
  // eslint-disable-next-line import/no-unresolved
  const { html } = await import('satori-html');
  const fn = params.format === 'html' ? join : html;

  if (params.template === 'default') {
    return getDefaultTemplate(params, fn);
  }
  if (params.template === 'section') {
    return getSectionTemplate(params, fn);
  }
  if (params.template === 'cover') {
    return getCoverTemplate(params, fn);
  }
  if (params.template === 'banner') {
    return getBannerTemplate(params, fn);
  }

  throw new Error('Invalid open graph template');
};

module.exports = {
  getTemplate,
  getLogoSvg,
};
