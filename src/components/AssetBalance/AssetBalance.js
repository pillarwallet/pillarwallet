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

import type { Rates } from 'models/Asset';

import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';

import { fontStyles, spacing, fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { formatAmount, formatFiat } from 'utils/common';
import { getRate } from 'utils/assets';

type Props = {
  isLoading?: boolean,
  balance: number,
  token: string,
  rates: Rates,
  fiatCurrency: string,
};

const BalanceWrapper = styled.View`
  padding: 0 ${spacing.large}px ${spacing.large}px;
  align-items: center;
`;

const Balance = styled(BaseText)`
  font-size: ${fontSizes.giant}px;
`;

const ValueInFiat = styled(BaseText)`
  ${fontStyles.small};
  text-align: center;
  color: ${themedColors.secondaryText};
`;

const AssetBalance = (props: Props) => {
  const {
    balance,
    token,
    rates,
    fiatCurrency,
    isLoading,
  } = props;

  if (isLoading) {
    return (
      <BalanceWrapper>
        <Spinner />
      </BalanceWrapper>
    );
  }

  const formattedBalance = formatAmount(balance);
  const totalInFiat = balance * getRate(rates, token, fiatCurrency);
  const formattedBalanceInFiat = formatFiat(totalInFiat, fiatCurrency);

  return (
    <BalanceWrapper>
      <Balance>
        {formattedBalance} {token}
      </Balance>
      <ValueInFiat>{formattedBalanceInFiat}</ValueInFiat>
    </BalanceWrapper>
  );
};

export default AssetBalance;
