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
import styled from 'styled-components/native';
import { fontStyles, appFont, fontSizes, lineHeights } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';


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
  if (props.primary) textProps.color = colors.primary;
  if (props.secondary) textProps.color = colors.secondaryText;
  if (props.negative) textProps.color = colors.negative;
  if (props.positive) textProps.color = colors.positive;
  if (props.tertiary) textProps.color = colors.tertiary;
  if (props.accent) textProps.color = colors.accent;
  if (props.synthetic) textProps.color = colors.synthetic;
  if (props.link) textProps.color = colors.link;
  if (props.danger) textProps.color = colors.danger;
  if (props.color) textProps.color = props.color; // for custom color

  // positioning
  if (props.center) textProps.textAlign = 'center';
  if (props.right) textProps.textAlign = 'right';

  // font size
  if (props.fontSize) {
    textProps.fontSize = props.fontSize;
  } else {
    textProps.fontSize = getFontSize(props);
  }

  // line height
  if (props.lineHeight) {
    textProps.lineHeight = props.lineHeight;
  } else {
    textProps.lineHeight = getLineHeight(props);
  }

  // other
  if (props.lineThrough) textProps.textDecoration = 'line-through';

  return { ...textProps };
};

export const BaseText = styled.Text`
  font-family: ${appFont.regular};
  text-align-vertical: center;
  color: ${themedColors.text};
  ${(props) => getTextStyle(props)}
`;

export const BoldText = styled(BaseText)`
  font-family: ${appFont.bold};
  text-align-vertical: center;
  color: ${themedColors.text};
  ${(props) => getTextStyle(props)}
`;

export const LightText = styled(BaseText)`
  font-family: ${appFont.light};
  text-align-vertical: center;
  color: ${themedColors.text};
  ${(props) => getTextStyle(props)}
`;

export const MediumText = styled(BaseText)`
  font-family: ${appFont.medium};
  text-align-vertical: center;
  color: ${themedColors.text};
  ${(props) => getTextStyle(props)}
`;

export const Title = styled(BaseText)`
  ${fontStyles.large};
  margin: 20px 0;
  padding: ${props => (props.padding ? '0 20px' : '0')};
  text-align: ${props => (props.align || 'left')};
`;

export const SubTitle = styled(BaseText)`
 ${fontStyles.big};
  color: ${themedColors.primary};
  text-align: ${props => (props.align || 'left')};
  margin: ${props => props.margin || '0 0 20px'};
`;

export const SubHeading = styled(LightText)`
  ${fontStyles.small};
  color: ${themedColors.secondaryText};
  letter-spacing: 0.4;
`;

export const SubHeadingMedium = styled(MediumText)`
  ${fontStyles.small};
  color: ${themedColors.secondaryText};
  letter-spacing: 0.4;
`;

export const Paragraph = styled(BaseText)`
  ${props => props.small ? fontStyles.medium : fontStyles.big};
  margin-bottom: ${props => props.small ? '5px' : '10px'};
  color: ${props => props.light ? themedColors.secondaryText : themedColors.text};
  text-align: ${props => props.center ? 'center' : 'left'};
  flex-wrap: wrap;
`;

export const TextLink = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.link};
  ${(props) => getTextStyle(props)}
`;

export const Label = styled(MediumText)`
  ${props => props.small ? fontStyles.medium : fontStyles.regular}px;
  color: ${props => props.color || themedColors.secondaryText};
`;

export const HelpText = styled(BaseText)`
  ${fontStyles.regular};
  ${({ noPadding }) => !noPadding && 'padding: 10px;'}
  color: ${({ color }) => color || 'grey'};
`;
