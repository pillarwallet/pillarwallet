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
