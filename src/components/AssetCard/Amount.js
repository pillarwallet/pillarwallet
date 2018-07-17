// @flow
import styled from 'styled-components/native';
import { fontSizes } from 'utils/variables';

export const Amount = styled.BaseText`
  font-size: ${fontSizes.extraLarge};
  line-height: ${fontSizes.extraLarge};
  color: #fff;
  font-weight: 300;
`;

export const FiatAmount = styled.BaseText`
  font-size: 14px;
  line-height: 14px;
  color: #fff;
  font-weight: 300;
  position: absolute;
  bottom: 20px;
  left: 14px;
`;

export const AmountToken = styled.BaseText`
  font-size: ${fontSizes.medium};
  line-height: ${fontSizes.extraLarge};
  color: #fff;
  font-weight: 700;
`;
