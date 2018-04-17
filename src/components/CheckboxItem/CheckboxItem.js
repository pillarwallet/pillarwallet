// @flow
import styled from 'styled-components/native';

const CheckboxItem = styled.View`
flex-direction: row;
align-items: center;
margin-bottom: ${props => (props.marginBottom ? 20 : 0)};
`;

export default CheckboxItem;
