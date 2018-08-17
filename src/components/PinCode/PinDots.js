// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

const Wrapper = styled.View`
  flex-wrap: wrap;
  margin-top: 20;
  margin-bottom: 40;
  flex-direction: row;
  align-self: center;
  justify-content: space-between;
  width: 180;
`;

const PinDot = styled.View`
  width: 10px;
  height: 10px;
  background-color: ${props => (props.active ? baseColors.electricBlue : baseColors.mediumGray)};
  border-radius: 10;
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
