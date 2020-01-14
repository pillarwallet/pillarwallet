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
import { Label, BaseText } from 'components/Typography';
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { formatAmount, formatFiat } from 'utils/common';
import { getRate } from 'utils/assets';
import type { Rates } from 'models/Asset';

type Props = {
  balance: number,
  token: string,
  rates: Rates,
  fiatCurrency: string,
};

const TextRow = styled.View`
  flex-direction: row;
`;

const Details = styled.View``;

const HelperText = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.secondaryText};
  margin-left: 4px;
`;

const SendTokenDetailsValue = styled(BaseText)`
  ${fontStyles.medium};
`;

const SendTokenDetails = (props: Props) => {
  const {
    balance,
    token,
    rates,
    fiatCurrency,
  } = props;

  const formattedBalance = formatAmount(balance);
  const totalInFiat = balance * getRate(rates, token, fiatCurrency);
  const formattedBalanceInFiat = formatFiat(totalInFiat, fiatCurrency);

  return (
    <Details>
      <Label small>Available Balance</Label>
      <TextRow>
        <SendTokenDetailsValue>
          {formattedBalance} {token}
        </SendTokenDetailsValue>
        <HelperText>{formattedBalanceInFiat}</HelperText>
      </TextRow>
    </Details>
  );
};

export default SendTokenDetails;
