// @flow
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

function getFontColor(direction: string) {
  if (direction === 'Sent') {
    return baseColors.fireEngineRed;
  }
  if (direction === 'Received') {
    return baseColors.jadeGreen;
  }
  return baseColors.black;
}

const Amount = styled.Text`
  text-align: right;
  margin-bottom: 5px;
  font-weight: 700;
  color: ${props => getFontColor(props.direction)};
`;

export default Amount;
