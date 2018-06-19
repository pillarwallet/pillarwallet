// @flow
import styled from 'styled-components/native';
import { UIColors, baseColors, fontSizes } from 'utils/variables';

export const Title = styled.Text`
  font-size: ${fontSizes.extraLarge};
  margin: 20px 0;
  font-weight: 700;
  padding: ${props => (props.padding ? '0 20px' : '0')};
  text-align: ${props => (props.align || 'left')};
`;

export const Paragraph = styled.Text`
  font-size: ${fontSizes.small};
  margin-bottom: 10;
  color: ${props => props.light ? baseColors.darkGray : UIColors.defaultTextColor};
  text-align: ${props => props.center ? 'center' : 'left'};
`;

export const TextLink = styled.Text`
  font-size: ${fontSizes.small};
  margin-right: 10px;
  color: ${UIColors.primary};
`;

export const Label = styled.Text`
  font-size: ${fontSizes.extraSmall};
  color: ${baseColors.darkGray};
  margin-bottom: 10;
  align-self: flex-start;
`;

export const HelpText = styled.Text`
  font-size: ${fontSizes.extraSmall};
  padding: 10px;
  color: grey;
`;
