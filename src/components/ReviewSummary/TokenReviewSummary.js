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
import styled from 'styled-components/native';

// components
import { BaseText, MediumText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';
import CollectibleImage from 'components/CollectibleImage';

// utils
import { formatFiat, formatTokenAmount } from 'utils/common';
import { wrapBigNumber } from 'utils/bigNumber';
import { images } from 'utils/images';
import { useTheme } from 'utils/themes';
import { getAssetRateInFiat } from 'utils/rates';

// selectors
import {
  useChainRates,
  useChainSupportedAssets,
  useFiatCurrency,
} from 'selectors';

// types
import type { Chain } from 'models/Chain';
import type { Value } from 'models/Value';


type Props = {
  amount: Value,
  assetSymbol: string,
  text: string,
  assetIcon?: {uri: string} | number,
  fiatAmount?: string,
  chain: Chain,
};

const Container = styled.View`
  align-items: center;
`;


export const TokenReviewSummaryComponent = ({
  assetSymbol,
  amount,
  text,
  assetIcon,
  fiatAmount,
  chain,
}: Props) => {
  const theme = useTheme();
  const fiatCurrency = useFiatCurrency();
  const chainSupportedAssets = useChainSupportedAssets(chain);
  const chainRates = useChainRates(chain);

  const asset = chainSupportedAssets.find(({ symbol }) => assetSymbol === symbol);
  const formattedAmount = formatTokenAmount(amount, assetSymbol);

  if (asset) {
    assetIcon = { uri: asset.iconUrl };
    const amountBN = wrapBigNumber(amount);
    if (!fiatAmount) {
      const assetRate = getAssetRateInFiat(chainRates, asset.address, fiatCurrency);
      fiatAmount = formatFiat(amountBN.times(assetRate).toNumber(), fiatCurrency);
    }
  }

  const { genericToken } = images(theme);

  return (
    <Container>
      <CollectibleImage
        source={assetIcon}
        width={64}
        height={64}
        fallbackSource={!!asset && genericToken}
      />
      <Spacing h={32} />
      <BaseText regular>{text}</BaseText>
      <Spacing h={4} />
      <BaseText giant>{formattedAmount} <MediumText secondary fontSize={20}>{assetSymbol}</MediumText></BaseText>
      <BaseText secondary small>{fiatAmount}</BaseText>
    </Container>
  );
};

export default TokenReviewSummaryComponent;
