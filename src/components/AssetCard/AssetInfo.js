// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import { getCurrencySymbol } from 'utils/common';
import { fontSizes, baseColors } from 'utils/variables';

type Props = {
  token: string,
  amount: string,
  disclaimer?: string,
  balanceInFiat: {
    amount: string | number,
    currency: string,
  },
}

const AmountWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
`;

const TokenAmountWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: baseline;
  align-self: flex-end;
  margin: 4px 0;
`;

const Amount = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
  color: ${baseColors.slateBlack};
`;

const FiatAmount = styled(LightText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  line-height: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.darkGray};
  align-self: flex-end;
  text-align: right;
`;

const Disclaimer = styled(LightText)`
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.small};
  color: ${baseColors.burningFire};
  align-self: flex-end;
  text-align: right;
`;

const AmountToken = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.small}px;
  color: ${baseColors.slateBlack};
`;

const AssetInfo = (props: Props) => {
  const {
    amount,
    token,
    balanceInFiat,
    disclaimer,
  } = props;

  const currencySymbol = getCurrencySymbol(balanceInFiat.currency);

  return (
    <AmountWrapper>
      <TokenAmountWrapper>
        <Amount>{amount}</Amount>
        <AmountToken> {token}</AmountToken>
      </TokenAmountWrapper>
      {disclaimer
        ? <Disclaimer>{disclaimer}</Disclaimer>
        : <FiatAmount>{currencySymbol}{balanceInFiat.amount}</FiatAmount>
      }
    </AmountWrapper>
  );
};


export default AssetInfo;
