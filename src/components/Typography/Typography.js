// @flow
import styled from 'styled-components/native';
import { UIColors, baseColors, fontSizes, fontWeights } from 'utils/variables';

export const BaseText = styled.Text`
  font-family: aktiv-grotesk-regular;
  include-font-padding: false;
  text-align-vertical: center;
`;

export const BoldText = styled(BaseText)`
  font-family: aktiv-grotesk-bold;
  include-font-padding: false;
  text-align-vertical: center;
`;

export const LightText = styled(BaseText)`
  font-family: aktiv-grotesk-light;
  include-font-padding: false;
  text-align-vertical: center;
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
  font-weight: ${fontWeights.bold};
  color: ${baseColors.darkGray};
  letter-spacing: 0.5;
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
  font-size: ${fontSizes.extraSmall};
  color: ${props => props.color || baseColors.darkGray};
`;

export const HelpText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  padding: 10px;
  color: grey;
`;
