// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
/* eslint-disable i18next/no-literal-string */

import * as React from 'react';
import styled from 'styled-components/native';
import { fontStyles, appFont, fontSizes, lineHeights } from 'utils/variables';
import { getThemeColors } from 'utils/themes';

import type { TextProps } from 'utils/types/react-native';
import type { Theme } from 'models/Theme';


type StyleValue = string | number | null | void;

// Naive transformer from css values to add px units to numeric prosp. Required by Styled Components.
const toCssLength = (value: StyleValue) => (typeof value === 'number' ? `${value}px` : value);

const getFontSize = (props) => {
  const propsKeys = Object.keys(props);
  let fontSize;

  propsKeys.forEach((prop: string) => {
    if (fontSizes[prop]) fontSize = fontSizes[prop];
  });

  return fontSize;
};

const getLineHeight = (props) => {
  const propsKeys = Object.keys(props);
  let lineHeight;

  propsKeys.forEach((prop: string) => {
    if (lineHeights[prop]) lineHeight = lineHeights[prop];
  });

  return lineHeight;
};

const getTextStyle = (props) => {
  const { theme } = props;
  const colors = getThemeColors(theme);
  const textProps = {};

  // color types
  if (props.primary) textProps.color = colors.basic000;
  if (props.secondary) textProps.color = colors.basic030;
  if (props.negative) textProps.color = colors.secondaryAccent240;
  if (props.positive) textProps.color = colors.secondaryAccent140;
  if (props.accent) textProps.color = colors.basic020;
  if (props.synthetic) textProps.color = colors.synthetic140;
  if (props.link) textProps.color = colors.basic000;
  if (props.danger) textProps.color = colors.secondaryAccent240;
  if (props.color && typeof props.color === 'string') textProps.color = props.color; // for custom color

  // positioning
  if (props.center) textProps.textAlign = 'center';
  if (props.right) textProps.textAlign = 'right';

  // font size
  if (props.fontSize) {
    textProps.fontSize = toCssLength(props.fontSize);
  } else {
    textProps.fontSize = toCssLength(getFontSize(props));
  }

  // line height
  if (props.lineHeight) {
    textProps.lineHeight = toCssLength(props.lineHeight);
  } else {
    textProps.lineHeight = toCssLength(getLineHeight(props));
  }

  // other
  if (props.lineThrough) textProps.textDecoration = 'line-through';

  return { ...textProps };
};

export type BaseTextProps = {|
  ...TextProps,
  theme?: Theme,

  // Variants
  primary?: boolean,
  secondary?: boolean,
  positive?: boolean,
  negative?: boolean,
  accent?: boolean,
  synthetic?: boolean,
  link?: boolean,
  danger?: boolean,
  color?: ?string,
  center?: boolean,
  right?: boolean,

  // Styles
  fontSize?: number,
  lineHeight?: number,
  lineThrough?: boolean,

  // Font Styles
  tiny?: boolean,
  small?: boolean,
  regular?: boolean,
  medium?: boolean,
  big?: boolean,
  large?: boolean,
  giant?: boolean,
  rSmall?: boolean,
  rRegular?: boolean,
  rBig?: boolean,
  rLarge?: boolean,
  rGiant?: boolean,
  rJumbo?: boolean,
|};

/**
 * @deprecated This compontent is considered legacy and should not be used in new code
 *
 * Use: components/core/Text instead
 */
export const BaseText: React.ComponentType<BaseTextProps> = styled.Text`
  font-family: "${appFont.regular}";
  text-align-vertical: center;
  color: ${({ theme }) => theme.colors.basic010};
  ${(props) => getTextStyle(props)}
`;

export const BoldText: React.ComponentType<BaseTextProps> = styled(BaseText)`
  font-family: "${appFont.bold}";
  text-align-vertical: center;
  color: ${({ theme }) => theme.colors.basic010};
  ${(props) => getTextStyle(props)}
`;

export const LightText: React.ComponentType<BaseTextProps> = styled(BaseText)`
  font-family: "${appFont.light}";
  text-align-vertical: center;
  color: ${({ theme }) => theme.colors.basic010};
  ${(props) => getTextStyle(props)}
`;

export const MediumText: React.ComponentType<BaseTextProps> = styled(BaseText)`
  font-family: "${appFont.medium}";
  text-align-vertical: center;
  color: ${({ theme }) => theme.colors.basic010};
  ${(props) => getTextStyle(props)}
`;

type TitleProps = {|
  ...BaseTextProps,
  align?: 'left' | 'right' | 'center' | 'auto' | 'justify',
  padding?: boolean,
|};

export const Title: React.ComponentType<TitleProps> = styled(BaseText)`
  ${fontStyles.large};
  margin: 20px 0;
  padding: ${(props) => (props.padding ? '0 20px' : '0')};
  text-align: ${(props) => props.align || 'left'};
`;

type SubTitleProps = {|
  ...BaseTextProps,
  align?: 'left' | 'right' | 'center' | 'auto' | 'justify',
  margin?: string,
|};

export const SubTitle: React.ComponentType<SubTitleProps> = styled(BaseText)`
  ${fontStyles.big};
  color: ${({ theme }) => theme.colors.basic000};
  text-align: ${(props) => props.align || 'left'};
  margin: ${(props) => props.margin || '0 0 20px'};
`;

export const SubHeading: React.ComponentType<BaseTextProps> = styled(LightText)`
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.basic020};
  letter-spacing: 0.4;
`;

export const SubHeadingMedium: React.ComponentType<BaseTextProps> = styled(MediumText)`
  ${fontStyles.small};
  color: ${({ theme }) => theme.colors.basic020};
  letter-spacing: 0.4;
`;

type ParagraphProps = {|
  ...BaseTextProps,
  light?: boolean,
|};

export const Paragraph: React.ComponentType<ParagraphProps> = styled(BaseText)`
  ${props => props.small ? fontStyles.medium : fontStyles.big};
  margin-bottom: ${props => props.small ? '5px' : '10px'};
  color: ${({ light, theme }) => light ? theme.colors.basic020 : theme.colors.basic010};
  text-align: ${props => props.center ? 'center' : 'left'};
  flex-wrap: wrap;
`;

export const TextLink: React.ComponentType<BaseTextProps> = styled(BaseText)`
  ${fontStyles.medium};
  color: ${({ theme }) => theme.colors.basic000};
  ${(props) => getTextStyle(props)}
`;

export const Label: React.ComponentType<BaseTextProps> = styled(MediumText)`
  ${(props) => (props.small ? fontStyles.medium : fontStyles.regular)}px;
  color: ${({ color, theme }) => color || theme.colors.basic020};
`;
