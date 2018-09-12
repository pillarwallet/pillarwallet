// @flow
import styled from 'styled-components/native';
import { BoldText } from 'components/Typography';
import { spacing, fontSizes, fontWeights } from 'utils/variables';

const SettingsModalTitle = styled(BoldText)`
  line-height: ${fontSizes.medium};
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
  margin: ${props => props.extraHorizontalSpacing ? `0 ${spacing.rhythm}px ${spacing.rhythm}px` : 0};
`;

export default SettingsModalTitle;
