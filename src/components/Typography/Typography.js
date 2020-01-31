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
import { fontStyles, appFont } from 'utils/variables';
import { themedColors } from 'utils/themes';

export const BaseText = styled.Text`
  font-family: ${appFont.regular};
  text-align-vertical: center;
  color: ${({ color }) => color || themedColors.text};
`;

export const BoldText = styled(BaseText)`
  font-family: ${appFont.bold};
  text-align-vertical: center;
  color: ${themedColors.text};
`;

export const LightText = styled(BaseText)`
  font-family: ${appFont.light};
  text-align-vertical: center;
  color: ${themedColors.text};
`;

export const MediumText = styled(BaseText)`
  font-family: ${appFont.medium};
  text-align-vertical: center;
  color: ${({ color }) => color || themedColors.text};
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
  color: ${themedColors.primary};
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
