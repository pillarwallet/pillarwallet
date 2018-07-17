// @flow
import styled from 'styled-components/native';
import { fontSizes, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';

const Timestamp = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.mediumGray};
`;

export default Timestamp;
