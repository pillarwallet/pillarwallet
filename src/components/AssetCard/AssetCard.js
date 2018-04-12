// @flow
import * as React from 'react';
import { AssetCardWrapper } from './AssetCardWrapper';
import { AssetCardIcon } from './AssetCardIcon';
import { AssetCardName } from './AssetCardName';
import { AssetCardAmount } from './AssetCardAmount';


type Props = {
  name: string,
  amount: number,
  color: string
}


const AssetCard = (props: Props) => {
  return (
    <AssetCardWrapper color={props.color}>
      <AssetCardIcon />
      <AssetCardName>{props.name}</AssetCardName>
      <AssetCardAmount>{props.amount}</AssetCardAmount>
    </AssetCardWrapper>
  );
};
export default AssetCard;
