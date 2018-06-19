// @flow
export const baseColors = {
  sunYellow: '#f8e71c',
  burningFire: '#F56C07',
  periwinkle: '#9191ff',
  electricBlue: '#007AFF',
  brightSkyBlue: '#00bfff',
  aquaMarine: '#50e3c2',
  freshEucalyptus: '#2AA057',
  snowWhite: '#fafafa',
  lightGray: '#f5f5f5',
  mediumGray: '#C6CACD',
  darkGray: '#8B939E',
  slateBlack: '#0A1427',
};

export const brandColors = [
  baseColors.periwinkle,
  baseColors.sunYellow,
  baseColors.burningFire,
  baseColors.brightSkyBlue,
  baseColors.aquaMarine,
];

export const UIColors = {
  primary: baseColors.electricBlue,
  danger: baseColors.burningFire,
  disabled: baseColors.mediumGray,
  defaultTextColor: baseColors.slateBlack,
  defaultBorderColor: 'rgba(0, 0, 0, 0.25)',
  defaultShadowColor: 'rgba(0, 0, 0, 0.25)',
};

export const fontSizes = {
  extraExtraSmall: 6,
  extraSmall: 9,
  small: 12,
  medium: 16,
  large: 22,
  extraLarge: 24,
  extraExtraLarge: 32,
};

export const fontWeights = {
  thin: '100',
  light: '300',
  book: '400',
  bold: '700',
  black: '900',
};
