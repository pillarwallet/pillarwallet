// @flow

import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { BoldText } from 'components/Typography';

export const CardContainer = styled.View`
  align-items: center;
  padding: 16px;
  border-bottom-width: 1;
  border-bottom-color: ${baseColors.mediumLightGray};
`;

export const Card = styled.View``;

export const CardBoard = styled.View`
  align-items: center;
  background-color: ${baseColors.white};
  border-radius: 6;
  height: ${({ height }) => height}px;
  padding: 15px 0 10px;
`;

export const NewSession = styled.View`
`;

export const Username = styled(BoldText)`
  font-size: ${fontSizes.large};
  margin-bottom: 10px;
`;
