// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';
import TankAssetBalance from 'components/TankAssetBalance';

type SettlementItem = {
  hash: string,
  symbol: string,
  value: string | number,
}

type Props = {
  settleData: SettlementItem[],
};

const ListsWrapper = styled.View`
  align-items: flex-end;
  padding-left: ${spacing.mediumLarge}px;
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.jadeGreen};
  text-align: right;
`;

export const PPNSettleList = ({ settleData: ppnTransactions }: Props) => {
  const valueByAsset: Object = {};
  ppnTransactions.forEach((trx) => {
    const key = trx.symbol;
    const value = +trx.value;
    if (!valueByAsset[key]) {
      valueByAsset[key] = { ...trx, value };
    } else {
      valueByAsset[key].value += value;
    }
  });

  const valuesArray = Object.keys(valueByAsset).map((key) => valueByAsset[key]);

  return (
    <ListsWrapper>
      {valuesArray.length &&
      valuesArray.map(({ symbol, value }) => <ItemValue key={symbol}>{`${value} ${symbol}`}</ItemValue>)}
      {ppnTransactions.map((trx) => (
        <TankAssetBalance
          key={trx.hash}
          amount={`-${trx.value} ${trx.symbol}`}
          monoColor
          textStyle={{ color: baseColors.scarlet }}
        />
      ))}
    </ListsWrapper>
  );
};
