// @flow
import styled from 'styled-components/native';
import { fontSizes, fontWeights, fontTrackings } from 'utils/variables';

const Name = styled.Text`
  font-size: ${fontSizes.mediumLarge};
  font-weight: ${fontWeights.bold};
  letter-spacing: ${fontTrackings.medium};
  line-height: ${fontSizes.mediumLarge};
  margin: 20px 0 0 14px;
  color: white;
`;

export default Name;
