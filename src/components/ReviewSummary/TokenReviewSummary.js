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
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';

// components
import { BaseText, MediumText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Image from 'components/Image';

// utils
import { formatTokenAmount } from 'utils/common';
import { getFormattedRate } from 'utils/assets';
import { images } from 'utils/images';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';

// selectors
import { useChainSupportedAssets } from 'selectors';

// types
import type { Rates, Asset } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { Chain } from 'models/Chain';


type Props = {
  amount: number,
  assetSymbol: string,
  text: string,
  rates: Rates,
  baseFiatCurrency: ?string,
  supportedAssets: Asset[],
  theme: Theme,
  assetIcon?: {uri: string} | number,
  fiatAmount?: string,
  chain: Chain,
};

const Container = styled.View`
  align-items: center;
`;

const TokenImage = styled(Image)`
  width: 64px;
  height: 64px;
`;

export const TokenReviewSummaryComponent = ({
  assetSymbol,
  amount,
  rates,
  baseFiatCurrency,
  text,
  theme,
  assetIcon,
  fiatAmount,
  chain,
}: Props) => {
  const supportedAssets = useChainSupportedAssets(chain);
  const asset = supportedAssets.find(({ symbol }) => assetSymbol === symbol);
  const formattedAmount = formatTokenAmount(amount, assetSymbol);

  if (asset) {
    assetIcon = { uri: asset.iconUrl };
    if (!fiatAmount) {
      fiatAmount = getFormattedRate(rates, amount, asset.symbol, baseFiatCurrency || defaultFiatCurrency);
    }
  }

  const { genericToken } = images(theme);

  return (
    <Container>
      <TokenImage source={assetIcon} fallbackSource={!!asset && genericToken} />
      <Spacing h={32} />
      <BaseText regular>{text}</BaseText>
      <Spacing h={4} />
      <BaseText giant>{formattedAmount} <MediumText secondary fontSize={20}>{assetSymbol}</MediumText></BaseText>
      <BaseText secondary small>{fiatAmount}</BaseText>
    </Container>
  );
};

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
});

export default withTheme(connect(mapStateToProps)(TokenReviewSummaryComponent));
