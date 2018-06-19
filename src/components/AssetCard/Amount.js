// @flow
import styled from 'styled-components/native';
import { fontSizes } from 'utils/variables';

export const Amount = styled.Text`
  font-size: ${fontSizes.extraLarge};
  line-height: ${fontSizes.extraLarge};
  color: white;
  font-weight: 300;
`;

export const FiatAmount = styled.Text`
  font-size: 14px;
  line-height: 14px;
  color: white;
  font-weight: 300;
  position: absolute;
  bottom: 20px;
  left: 14px;
`;

export const AmountToken = styled.Text`
  font-size: ${fontSizes.medium};
  line-height: ${fontSizes.extraLarge};
  color: white;
  font-weight: 700;
`;
