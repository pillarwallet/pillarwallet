// @flow
import styled from 'styled-components/native';

const AssetHeader = styled.View`
  background-color: #2CB3F8;
  height: ${props => props.size ? props.height : 100};
  justify-content: center;
  align-items: center;
`;

export default AssetHeader;
