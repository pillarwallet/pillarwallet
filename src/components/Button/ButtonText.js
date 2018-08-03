// @flow
import styled from 'styled-components/native';
import { BoldText } from 'components/Typography';
import { fontSizes } from 'utils/variables';

const ButtonText = styled(BoldText)`
  color: ${props => props.theme.color};
  font-size: ${fontSizes.medium};
`;

export default ButtonText;
