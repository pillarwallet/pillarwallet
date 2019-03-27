// @flow

import styled from 'styled-components/native';
import { fontSizes, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';

export const DetailView = styled.View`
  padding: 0 20px 16px 20px;
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
