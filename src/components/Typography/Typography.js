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
import { UIColors, baseColors, fontSizes, fontWeights } from 'utils/variables';

export const BaseText = styled.Text`
  font-family: Aktiv Grotesk App;
  font-weight: 400;
  include-font-padding: false;
  text-align-vertical: center;
  color: ${UIColors.defaultTextColor};
`;

export const BoldText = styled(BaseText)`
  font-family: Aktiv Grotesk App;
  font-weight: 600;
  include-font-padding: false;
  text-align-vertical: center;
  color: ${UIColors.defaultTextColor};
`;

export const LightText = styled(BaseText)`
  font-family: Aktiv Grotesk App;
  font-weight: 300;
  include-font-padding: false;
  text-align-vertical: center;
  color: ${UIColors.defaultTextColor};
`;

export const MediumText = styled(BaseText)`
  font-family: Aktiv Grotesk App;
  font-weight: 500;
  include-font-padding: false;
  text-align-vertical: center;
  color: ${UIColors.defaultTextColor};
`;


export const Title = styled(BaseText)`
  font-size: ${fontSizes.extraLarge};
  margin: 20px 0;
  font-weight: 700;
  padding: ${props => (props.padding ? '0 20px' : '0')};
  text-align: ${props => (props.align || 'left')};
`;

export const SubTitle = styled(BaseText)`
  font-size: ${fontSizes.medium};
  font-weight: 400;
  color: ${UIColors.primary};
  text-align: ${props => (props.align || 'left')};
  line-height: 24px;
  margin: ${props => props.margin || '0 0 20px'};
`;

export const SubHeading = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall};
  font-weight: ${fontWeights.book};
  color: ${baseColors.darkGray};
  letter-spacing: 0.4;
`;

export const Paragraph = styled(BaseText)`
  font-size: ${props => props.small ? fontSizes.small : fontSizes.medium};
  margin-bottom: ${props => props.small ? '5px' : '10px'};
  color: ${props => props.light ? baseColors.darkGray : UIColors.defaultTextColor};
  text-align: ${props => props.center ? 'center' : 'left'};
`;

export const TextLink = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${UIColors.primary};
`;

export const Label = styled(BaseText)`
  font-size: ${props => props.small ? fontSizes.small : fontSizes.extraSmall};
  color: ${props => props.color || baseColors.darkGray};
`;

export const HelpText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  padding: 10px;
  color: grey;
`;
