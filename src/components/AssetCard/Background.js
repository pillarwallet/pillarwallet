// @flow
import styled from 'styled-components/native';
import { UIColors } from 'utils/variables';
import { LinearGradient } from 'expo';


const Background = styled(LinearGradient)`
  flex: 1;
  flex-direction: row;
  border-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
  border-radius: 20px;
  overflow: hidden;
`;

export default Background;
