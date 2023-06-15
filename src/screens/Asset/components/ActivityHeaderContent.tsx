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
import React from 'react';

// Utils
import { fiatTokenValue } from 'utils/rates';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';

// Selectors
import { useRatesPerChain, useFiatCurrency } from 'selectors';

// Types
import type { TokenDetails } from 'models/Asset';
import type { Chain } from 'models/Chain';

interface Props {
  tokenDetails: TokenDetailsProps;
  chain: Chain;
  isPoolActivity?: boolean;
}

type TokenDetailsProps = {
  data: TokenDetails;
  isLoading: boolean;
};

const ActivityHeaderContent = ({ chain, tokenDetails, isPoolActivity }: Props) => {
  const currency = useFiatCurrency();
  const ratesPerChain = useRatesPerChain();

  const { data: tokenDetailsData } = tokenDetails;

  const liquidityValue = tokenDetailsData?.liquidityUSD
    ? fiatTokenValue(tokenDetailsData?.liquidityUSD, ratesPerChain[chain], currency)
    : null;

  const tradingvolume = tokenDetailsData?.tradingVolume ? fiatTokenValue(tokenDetailsData?.tradingVolume, ratesPerChain[chain], currency) : null;

  return (
    <>
      {liquidityValue && isPoolActivity && <Text variant="large">{liquidityValue}</Text>}
      {tradingvolume && !isPoolActivity && <Text variant="large">{tradingvolume}</Text>}
      <Spacing h={6} />
    </>
  );
};

export default ActivityHeaderContent;
