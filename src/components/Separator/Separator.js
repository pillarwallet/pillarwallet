// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors } from 'utils/variables';

type Props = {
  spaceOnLeft?: number;
}

const SeparatorWrapper = styled.View`
  padding-left: ${props => props.spaceOnLeft ? props.spaceOnLeft : 50}px;
  // Below should use variable once move to 20px is applied universally
  margin-left: 16px;
`;

const SeparatorLine = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${UIColors.defaultBorderColor};
`;

const Separator = (props: Props) => {
  return (
    <SeparatorWrapper spaceOnLeft={props.spaceOnLeft}>
      <SeparatorLine />
    </SeparatorWrapper>
  );
};

export default Separator;
