// @flow
import * as React from 'react';
import styled from 'styled-components/native';

const Wrapper = styled.View`
  flex-wrap: wrap;
  margin-top: 20;
  margin-bottom: 40;
  flex-direction: row;
  align-self: center;
  justify-content: space-between;
  width: 150;
`;

const PinDot = styled.View`
  width: 12px;
  height: 12px;
  background-color: gray;
  border-radius: 6;
  opacity: ${props => (props.active ? 1 : 0.5)};
`;

type Props = {
  numAllDots: number,
  numActiveDots: number,
}

const PinDots = (props: Props) => {
  const { numAllDots, numActiveDots } = props;
  const dotsArray = Array(numAllDots).fill('')
    .map((el, i) => ({
      key: i,
      active: numActiveDots >= (i + 1),
    }));

  return (
    <Wrapper>
      {dotsArray.map(({ key, active }) => (
        <PinDot key={key} active={active} />
      ))}
    </Wrapper>
  );
};


export default PinDots;
