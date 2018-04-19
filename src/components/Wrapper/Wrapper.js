// @flow
import styled from 'styled-components/native';

const Wrapper = styled.ScrollView`
  padding: ${props => (props.padding ? '0 20px' : '0')};
`;

export default Wrapper;
