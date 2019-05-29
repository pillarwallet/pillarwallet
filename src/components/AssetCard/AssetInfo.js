// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components/native';
import { LightText, BoldText } from 'components/Typography';
import TankAssetBalance from 'components/TankAssetBalance';
import { getCurrencySymbol } from 'utils/common';
import { fontSizes, baseColors } from 'utils/variables';

type Props = {
  token: string,
  disclaimer?: string,
  balance: {
    value: string,
    valueInFiat: string | number,
  },
  balanceOnNetwork?: {
    valueOnNetwork?: string,
    valueOnNetworkInFiat?: string | number,
  },
  currency: string,
}

const AmountWrapper = styled.View`
  flex-direction: column;
  align-items: flex-end;
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

const AmountRow = styled.View`
  flex-direction: row;
`;

const AssetInfo = (props: Props) => {
  const {
    balance = {},
    balanceOnNetwork = {},
    token,
    disclaimer,
    currency,
  } = props;

  const { value, valueInFiat } = balance;
  const { valueOnNetwork, valueOnNetworkInFiat } = balanceOnNetwork;

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <AmountWrapper>
      <TokenAmountWrapper>
        <Amount>{value}</Amount>
        <AmountToken> {token}</AmountToken>
      </TokenAmountWrapper>
      {!!valueOnNetwork &&
      <TankAssetBalance
        amount={valueOnNetwork}
        isSynthetic={token !== 'ETH'}
        wrapperStyle={{ marginBottom: 5, marginTop: -2 }}
      />
      }
      {disclaimer
        ? <Disclaimer>{disclaimer}</Disclaimer>
        :
        <AmountRow>
          {!!valueOnNetworkInFiat && <FiatAmount>{currencySymbol}{valueOnNetworkInFiat} + </FiatAmount>}
          <FiatAmount>{currencySymbol}{valueInFiat}</FiatAmount>
        </AmountRow>
      }
    </AmountWrapper>
  );
};


export default AssetInfo;
