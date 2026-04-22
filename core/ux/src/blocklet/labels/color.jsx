import chroma from 'chroma-js';

const getTextColor = (color, mode) => {
  const base = chroma(color);
  return mode === 'dark' ? base.brighten(4).hex() : base.hex();
};

const getBorderColor = (color, mode) => {
  const base = chroma(color);

  if (mode === 'dark') return base.brighten(2).alpha(0.4).hex();

  return base.luminance() > 0.5 ? base.darken(3).hex() : base.brighten(0.5).alpha(0.25).hex();
};

const getBackgroundColor = (color, mode) => {
  const base = chroma(color);

  if (mode === 'dark') {
    return base.luminance() > 0.5 ? base.darken(2).alpha(0.5).hex() : base.brighten(1.5).alpha(0.35).hex();
  }

  return base.luminance() > 0.5 ? base.darken(2.5).hex() : base.brighten(2.5).alpha(0.25).hex();
};

const getFilterStyle = (color, mode) => {
  if (mode === 'dark') return 'brightness(1.3) contrast(1.2)';
  return 'brightness(0.85) contrast(1.2)';
};

export { getTextColor, getBackgroundColor, getBorderColor, getFilterStyle };
