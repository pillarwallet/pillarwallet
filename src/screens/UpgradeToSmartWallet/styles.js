// @flow

import styled from 'styled-components/native';
import { fontSizes, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';

export const DetailBox = styled.View`
  margin: 80px 20px 35px;
`;

export const Detail = styled(BaseText)`
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.small};
`;
