// @flow
import * as React from 'react';
import Wrapper from './Wrapper';
import Icon from './Icon';
import Name from './Name';
import Amount from './Amount';


type Props = {
  name: string,
  amount: number,
  color: string
}


const AssetCard = (props: Props) => {
  return (
    <Wrapper color={props.color}>
      <Icon />
      <Name>{props.name}</Name>
      <Amount>{props.amount}</Amount>
    </Wrapper>
  );
};
export default AssetCard;
