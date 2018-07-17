// @flow
import styled from 'styled-components/native';
import { fontSizes, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';

const Status = styled(BaseText)`
  text-align: right;
  color: ${baseColors.mediumGray};
  font-size: ${fontSizes.small};
`;

export default Status;
