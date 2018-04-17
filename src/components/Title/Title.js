// @flow
import styled from 'styled-components/native';

const Title = styled.Text`
  font-size: 32;
  margin-bottom: 20;
  text-align: ${props => (props.center ? 'center' : 'left')};
`;

export default Title;
