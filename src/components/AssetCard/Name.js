// @flow
import styled from 'styled-components/native';
import { fontSizes, fontTrackings } from 'utils/variables';
import { BoldText } from 'components/Typography';

const Name = styled(BoldText)`
  font-size: ${fontSizes.mediumLarge};
  letter-spacing: ${fontTrackings.medium};
  line-height: ${fontSizes.mediumLarge};
  margin: 20px 0 0 14px;
  color: white;
`;

export default Name;
