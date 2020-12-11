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
import { getEnv } from 'configs/envConfig';
import { CachedImage } from 'react-native-cached-image';
import { BaseText, MediumText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import { formatAmount } from 'utils/common';
import { getFormattedRate } from 'utils/assets';
import { images } from 'utils/images';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import type { Rates, Asset } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';


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
};

const Container = styled.View`
  align-items: center;
`;

const TokenImage = styled(CachedImage)`
  width: 64px;
  height: 64px;
`;

export const TokenReviewSummaryComponent = ({
  assetSymbol, amount, rates, baseFiatCurrency, text, supportedAssets, theme, assetIcon, fiatAmount,
}: Props) => {
  const asset = supportedAssets.find(({ symbol }) => assetSymbol === symbol);
  const formattedAmount = formatAmount(amount);

  if (asset) {
    assetIcon = { uri: `${getEnv().SDK_PROVIDER}/${asset.iconUrl}?size=3` };
    fiatAmount = getFormattedRate(rates, amount, asset.symbol, baseFiatCurrency || defaultFiatCurrency);
  }

  const { genericToken } = images(theme);

  return (
    <Container>
      <TokenImage source={assetIcon} fallbackSource={!!asset && genericToken} />
      <Spacing h={16} />
      <BaseText regular>{text}</BaseText>
      <Spacing h={16} />
      <MediumText giant>{formattedAmount} <MediumText secondary fontSize={20}>{assetSymbol}</MediumText></MediumText>
      <Spacing h={7} />
      <BaseText secondary small>{fiatAmount}</BaseText>
    </Container>
  );
};

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  supportedAssets,
});

export default withTheme(connect(mapStateToProps)(TokenReviewSummaryComponent));
