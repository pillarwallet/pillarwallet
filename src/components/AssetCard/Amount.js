// @flow
import styled from 'styled-components/native';
import { fontSizes } from 'utils/variables';
import { LightText, BoldText } from 'components/Typography';

export const Amount = styled(LightText)`
  font-size: ${fontSizes.extraLarge};
  line-height: ${fontSizes.extraLarge};
  color: #fff;
`;

export const FiatAmount = styled(LightText)`
  font-size: 14px;
  line-height: 14px;
  color: #fff;
  position: absolute;
  bottom: 20px;
  left: 14px;
`;

export const AmountToken = styled(BoldText)`
  font-size: ${fontSizes.medium};
  line-height: ${fontSizes.extraLarge};
  color: #fff;
`;
