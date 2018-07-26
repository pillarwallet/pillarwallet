// @flow
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

const Item = styled.TouchableOpacity`
  width: 100%;
  padding: 20px 16px;
  flex-direction: row;
  background-color: ${props => props.isEven ? baseColors.whiteSmoke : baseColors.snowWhite};
`;

export default Item;
