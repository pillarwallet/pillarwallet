// @flow

import styled from 'styled-components/native';
import { fontSizes, fontWeights, baseColors } from 'utils/variables';
import { BaseText, BoldText } from 'components/Typography';

export const DetailView = styled.View`
  padding: 0 20px 0;
`;

export const Detail = styled(BaseText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small};
  margin-bottom: 36px;
`;

export const VisibleLabel = styled(BaseText)`
  align-self: flex-end;
  color: ${baseColors.coolGrey};
  font-size: ${fontSizes.extraExtraSmall};
`;

export const ModalTitle = styled(BoldText)`
  line-height: ${fontSizes.medium};
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;
