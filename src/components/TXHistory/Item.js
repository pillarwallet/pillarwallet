// @flow
import styled from 'styled-components/native';
import { baseColors, spacingSizes } from 'utils/variables';

const Item = styled.TouchableOpacity`
  width: 100%;
  padding: 20px ${spacingSizes.defaultHorizontalMargin}px;
  flex-direction: row;
  background-color: ${props => props.isEven ? baseColors.whiteSmoke : baseColors.snowWhite};
`;

export default Item;
