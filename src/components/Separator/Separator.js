// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, spacing } from 'utils/variables';

type Props = {
  spaceOnLeft?: number,
};

const SeparatorWrapper = styled.View`
  padding-left: ${props => (props.spaceOnLeft ? props.spaceOnLeft : 44)}px;
  margin-left: ${spacing.rhythm / 2}px;
`;

const SeparatorLine = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${UIColors.defaultDividerColor};
`;

const Separator = (props: Props) => {
  return (
    <SeparatorWrapper spaceOnLeft={props.spaceOnLeft}>
      <SeparatorLine />
    </SeparatorWrapper>
  );
};

export default Separator;
