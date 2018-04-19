// @flow
import styled from 'styled-components/native';

const Title = styled.Text`
  font-size: 32;
  margin: 20px 0;
  padding: ${props => (props.padding ? '0 20px' : '0')};
  text-align: ${props => (props.center ? 'center' : 'left')};
`;

export default Title;
