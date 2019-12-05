// @flow
import * as React from 'react';
import styled from 'styled-components/native';

type Props = {
  children: React.Node,
  zIndex?: number,
}

const StandOutWrapper = styled.View`
  position: relative;
  z-index: ${({ zIndex }) => zIndex || 10};
`;

export const WalkthroughItemParent = (props: Props) => {
  const {
    zIndex,
    children,
  } = props;

  return (
    <StandOutWrapper zIndex={zIndex}>
      {children}
    </StandOutWrapper>
  );
};

