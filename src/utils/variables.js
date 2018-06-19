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
  defaultBackgroundColor: baseColors.snowWhite,
  defaultBorderColor: 'rgba(0, 0, 0, 0.25)',
  defaultShadowColor: 'rgba(0, 0, 0, 0.25)',
};

export const fontSizes = {
  extraExtraSmall: 10,
  extraSmall: 12,
  small: 14,
  medium: 16,
  mediumLarge: 18,
  large: 22,
  extraLarge: 24,
  extraExtraLarge: 32,
  giant: 36,
};

export const fontTrackings = {
  small: 0.2,
  medium: 0.3,
  large: 0.5,
}

export const fontWeights = {
  thin: '100',
  light: '300',
  book: '400',
  bold: '700',
  black: '900',
};
