// @flow
import styled from 'styled-components/native';
import { BoldText } from 'components/Typography';

const ButtonText = styled(BoldText)`
  color: ${props => props.theme.color};
  font-size: 18px;
`;

export default ButtonText;
