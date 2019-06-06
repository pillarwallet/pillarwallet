// @flow

import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { Center } from 'components/Layout';
import { BoldText } from 'components/Typography';
import Spinner from 'components/Spinner';
import ButtonText from 'components/ButtonText';

export const CardContainer = styled.View`
  align-items: center;
  padding: 16px;
  border-bottom-width: 1;
  border-bottom-color: ${baseColors.mediumLightGray};
  background-color: ${baseColors.snowWhite};
`;

export const Card = styled.View``;

export const CardBoard = styled.View`
  align-items: center;
  background-color: ${baseColors.white};
  border-radius: 6;
  height: ${({ height }) => height}px;
  padding: 15px 0 10px;
`;

export const NewSession = styled.View``;

export const StatusMessage = styled(BoldText)`
  padding-top: 10px;
`;

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

export const CancelButton = styled(ButtonText)``;

export const Username = styled(BoldText)`
  font-size: ${fontSizes.large};
  margin-bottom: 10px;
`;

export const SheetContentWrapper = styled.View`
  flex: 1;
  padding-top: 70px;
`;

export const SheetEmptyContent = styled(Center)`
  flex: 1;
`;

export const SheetEmptyText = styled(BoldText)`
  color: ${baseColors.mediumGray};
`;
