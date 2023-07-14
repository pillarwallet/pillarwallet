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
import React, { useMemo, useState } from 'react';
import t from 'translations/translate';
import { Dimensions } from 'react-native';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import TokenIcon from 'components/display/TokenIcon';
import { Spacing } from 'components/legacy/Layout';

// Selectors
import { useChainRates, useRootSelector } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { useTokenDetailsQuery, useMarketDetailsQuery, useHistoricalTokenPriceQuery } from 'utils/etherspot';
import { getAssetRateInFiat } from 'utils/rates';
import { getBalance } from 'utils/assets';
import { convertDecimalNumber } from 'utils/common';

// Constants
import { ONE_DAY } from 'constants/assetsConstants';
import { USD } from 'constants/assetsConstants';

// models, types
import type { AssetDataNavigationParam } from 'models/Asset';

// Local
import DurationSelection from './components/DurationSelection';
import YourBalanceContent from './components/YourBalanceContent';
import TokenAnalytics from './components/TokenAnalytics';
import AnimatedGraph from 'components/AnimatedGraph';
import HeaderContent from './components/HeaderContent';
import AnimatedFloatingActions from './AnimatedFloatingActions';

const AssetScreen = () => {
  const navigation = useNavigation();

  const accountAssetsBalances = useRootSelector(accountAssetsBalancesSelector);

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');
  const { chain, imageUrl, contractAddress, token } = assetData;

  const { width: screenWidth } = Dimensions.get('window');

  const chainRates = useChainRates(chain);
  const config = useChainConfig(chain);

  const [selectedPeriod, setSelectedPeriod] = useState(ONE_DAY);
  const [pointerTokenValue, setPointerTokenValue] = useState(0);
  const [pointerVisible, setPointerVisible] = useState(false);

  let tokenDetailsQuery = useTokenDetailsQuery(assetData);
  let marketDetailsQuery = useMarketDetailsQuery(assetData);
  let historicalTokenPricesQuery = useHistoricalTokenPriceQuery(assetData, selectedPeriod);

  if (tokenDetailsQuery?.data) {
    const { tokenAddress } = tokenDetailsQuery?.data;
    if (tokenAddress !== contractAddress?.toLowerCase()) {
      tokenDetailsQuery.data = null;
    }
  }
  if (marketDetailsQuery?.data) {
    const { symbol } = marketDetailsQuery?.data;
    if (symbol.toUpperCase() !== token) {
      marketDetailsQuery.data = null;
    }
  }
  if (historicalTokenPricesQuery?.data) {
    const { items } = historicalTokenPricesQuery.data;
    if (items?.[0]?.tokenAddress !== contractAddress?.toLowerCase()) {
      historicalTokenPricesQuery.data = null;
    }
  }

  const networkName = chain ? config.title : undefined;

  const tokenRateCMC = useMemo(() => {
    if (!tokenDetailsQuery.data) return null;
    const { usdPrice } = tokenDetailsQuery.data;
    return convertDecimalNumber(usdPrice);
  }, [tokenDetailsQuery.data]);

  const tokenRate = getAssetRateInFiat(chainRates, contractAddress, USD);
  const walletBalances = accountAssetsBalances[chain]?.wallet ?? {};
  const balance = getBalance(walletBalances, contractAddress);

  return (
    <Container>
      <HeaderBlock
        centerItems={[
          {
            custom: <TokenIcon url={imageUrl} chain={chain} size={24} />,
          },
          {
            title: ` ${assetData.name} ${t('label.on_network', { network: networkName })}`,
          },
        ]}
        centerItemsStyle={[
          { maxWidth: screenWidth * 0.8 },
          networkName.length > 10 && { marginLeft: screenWidth * 0.05 },
        ]}
        customOnBack={() => navigation.dismiss()}
        noPaddingTop
      />
      <Content scrollEnabled={!pointerVisible} bounces={false} paddingHorizontal={0} paddingVertical={0}>
        <Container style={{ alignItems: 'center' }}>
          <Spacing h={20} />
          <HeaderContent
            chain={chain}
            period={selectedPeriod}
            tokenRate={pointerVisible ? convertDecimalNumber(pointerTokenValue) : tokenRateCMC || tokenRate}
            marketDetails={marketDetailsQuery}
            tokenDetails={tokenDetailsQuery}
          />
          <Spacing h={10} />

          <AnimatedGraph
            period={selectedPeriod}
            tokenDetailsData={tokenDetailsQuery.data}
            marketData={marketDetailsQuery.data}
            historicData={historicalTokenPricesQuery}
            onChangePointer={(item, isActive) => {
              setPointerTokenValue(item.value);
              setPointerVisible(isActive);
            }}
          />
          <Spacing h={10} />
          <DurationSelection selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
          <Spacing h={20} />
          <YourBalanceContent
            tokenRate={tokenRateCMC || tokenRate}
            period={selectedPeriod}
            balance={balance}
            marketDetails={marketDetailsQuery}
            assetData={assetData}
          />
          <Spacing h={36} />
          <TokenAnalytics
            tokenRate={tokenRateCMC || tokenRate}
            tokenDetails={tokenDetailsQuery}
            marketDetails={marketDetailsQuery}
          />
          <Spacing h={130} />
        </Container>
      </Content>
      <AnimatedFloatingActions assetData={assetData} />
    </Container>
  );
};

export default AssetScreen;
