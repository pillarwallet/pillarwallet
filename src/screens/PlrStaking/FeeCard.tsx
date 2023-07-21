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
import { BigNumber, ethers } from 'ethers';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Components
import Text from 'components/core/Text';

// Utils
import { getBalanceInFiat } from 'utils/assets';
import { formatFiatValue } from 'utils/format';

interface IFeeCard {
  value: string;
  chain: string;
  address: string;
  symbol?: string;
}

const FeeCard: React.FC<IFeeCard> = ({ value, chain, address, symbol }) => {
  const chainRates = useChainRates(chain);
  const currency = useFiatCurrency();

  if (!value) return null;

  const etherValue = ethers.utils.formatEther(BigNumber.from(value.toString()));
  const valueInFiat = getBalanceInFiat(currency, etherValue, chainRates, address);
  const labelValue = formatFiatValue(valueInFiat, currency);
  return <Text>{labelValue}</Text>;
};

export default FeeCard;
