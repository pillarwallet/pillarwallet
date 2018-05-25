// @flow
import styled from 'styled-components/native';
import { UIColors, baseColors } from 'utils/variables';

const CheckboxVisible = styled.View`
  width: 30;
  height: 30;
  margin-right: 20;
  border-radius: 60;
  border-width: 2;
  border-color: ${props => (props.active ? UIColors.primary : baseColors.mediumGray)};
`;

export default CheckboxVisible;
