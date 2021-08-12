// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useQuery } from 'react-query';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useDebounce } from 'use-debounce';
import { orderBy, maxBy } from 'lodash';
import { useTranslation } from 'translations/translate';

// Components
import { Container, Content } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Icon from 'components/modern/Icon';
import Spinner from 'components/Spinner';
import ValueInput from 'components/ValueInput';

// Constants
import { ETH, PLR } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';
import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';

// Services
import etherspotService from 'services/etherspot';

// Selectors
import {
  useRootSelector,
  useFiatCurrency,
  useChainSupportedAssets,
  useChainRates,
} from 'selectors';
import { accountEthereumAssetsSelector } from 'selectors/assets';
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

// Utils
import { useChainConfig } from 'utils/uiConfig';

// Types
import type { QueryResult } from 'utils/types/react-query';
import type { AssetOption } from 'models/Asset';
import type { ExchangeOffer } from 'models/Exchange';

// Local
import OfferCard from './OfferCard';
import { shouldTriggerSearch, getExchangeFromAssetOptions, getExchangeToAssetOptions } from './utils';

function Exchange() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const fromInputRef = React.useRef();

  const fiatCurrency = useFiatCurrency();
  const ethereumRates = useChainRates(CHAIN.ETHEREUM);
  const balances = useRootSelector(accountEthereumWalletAssetsBalancesSelector);
  const assets = useRootSelector(accountEthereumAssetsSelector);

  const initialFromSymbol: string = navigation.getParam('fromAssetCode') || ETH;
  const initialToSymbol: string = navigation.getParam('toAssetCode') || PLR;

  const [fromSymbol, setFromSymbol] = React.useState(initialFromSymbol);
  const [toSymbol, setToSymbol] = React.useState(initialToSymbol);

  const [rawFromAmount, setFromAmount] = React.useState('');
  const [fromAmount]: [string] = useDebounce(rawFromAmount, 500);

  const chainConfig = useChainConfig(CHAIN.ETHEREUM);
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);

  const fromOptions = React.useMemo(
    () => getExchangeFromAssetOptions(assets, ethereumSupportedAssets, balances, fiatCurrency, ethereumRates),
    [assets, ethereumSupportedAssets, balances, fiatCurrency, ethereumRates],
  );

  const toOptions = React.useMemo(() => getExchangeToAssetOptions(
    ethereumSupportedAssets,
    balances,
    fiatCurrency,
    ethereumRates,
  ), [
    ethereumSupportedAssets,
    balances,
    fiatCurrency,
    ethereumRates,
  ]);

  const fromAsset = React.useMemo(() => fromOptions.find((a) => a.symbol === fromSymbol), [fromOptions, fromSymbol]);
  const toAsset = React.useMemo(() => toOptions.find((a) => a.symbol === toSymbol), [toOptions, toSymbol]);

  // ValueInput crashes without asset.
  const fallbackAsset = React.useMemo(() => toOptions.find((a) => a.symbol === ETH), [toOptions]);

  const offersQuery = useOffersQuery(fromAsset, toAsset, fromAmount);
  const offers = sortOffers(offersQuery.data);

  // Focus on from amount input after user changes from or to asset
  React.useEffect(() => {
    let isCancelled = false;

    setTimeout(() => {
      if (!isCancelled) fromInputRef.current?.focus();
    }, 650);

    return () => {
      isCancelled = true;
    };
  }, [fromAsset, toAsset]);

  const handleOfferPress = (offer: ExchangeOffer) => {
    navigation.navigate(EXCHANGE_CONFIRM, { offer });
  };

  const allowSwap = fromOptions.some((option) => option.symbol === toSymbol);

  const handleSwapAssets = () => {
    if (!allowSwap) return;

    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setFromAmount('');
  };

  const handleFromAmountChange = (input: string) => {
    setFromAmount(input.replace(/,/g, '.'));
  };

  const formattedToAmount = maxBy(offers, (offer) => offer.toAmount)?.toAmount.toFixed();

  const showLoading = offersQuery.isFetching;
  const showEmptyState = !offers?.length && !offersQuery.isIdle && !offersQuery.isFetching;

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('exchangeContent.title.exchange', { chain: chainConfig.titleShort }) }]}
        navigation={navigation}
        noPaddingTop
      />

      <Content onScroll={() => Keyboard.dismiss()}>
        <FormWrapper>
          <ValueInput
            assetData={fromAsset || fallbackAsset}
            onAssetDataChange={(asset) => setFromSymbol(asset.symbol)}
            value={rawFromAmount}
            onValueChange={handleFromAmountChange}
            selectorOptionsTitle={t('label.sell')}
            customAssets={fromOptions}
            leftSideSymbol="minus"
            getInputRef={(ref) => {
              fromInputRef.current = ref;
            }}
            onBlur={() => fromInputRef.current?.blur()}
          />

          <TouchableSwapIcon onPress={handleSwapAssets} disabled={!allowSwap}>
            <Icon name="arrow-up-down" />
          </TouchableSwapIcon>

          <ValueInput
            disabled
            value={formattedToAmount}
            assetData={toAsset || fallbackAsset}
            onAssetDataChange={(asset) => setToSymbol(asset.symbol)}
            selectorOptionsTitle={t('label.buy')}
            customAssets={toOptions}
            leftSideSymbol="plus"
            onBlur={() => fromInputRef.current?.blur()}
            hideMaxSend
          />
        </FormWrapper>

        {showLoading && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}

        {!showLoading &&
          offers?.map((offer) => (
            <OfferCard
              key={offer.provider}
              offer={offer}
              disabled={false}
              isLoading={false}
              onPress={() => handleOfferPress(offer)}
            />
          ))}

        {showEmptyState && (
          <EmptyStateWrapper>
            <EmptyStateParagraph
              title={t('exchangeContent.emptyState.offers.title')}
              bodyText={t('exchangeContent.emptyState.offers.paragraph')}
              large
            />
          </EmptyStateWrapper>
        )}
      </Content>
    </Container>
  );
}

export default Exchange;

function useOffersQuery(
  fromAsset: ?AssetOption,
  toAsset: ?AssetOption,
  fromAmount: string,
): QueryResult<ExchangeOffer[]> {
  const enabled = shouldTriggerSearch(fromAsset, toAsset, fromAmount);

  return useQuery(
    ['ExchangeOffers', fromAsset, toAsset, fromAmount],
    () => etherspotService.getExchangeOffers(CHAIN.ETHEREUM, fromAsset, toAsset, BigNumber(fromAmount)),
    { enabled, cacheTime: 0 },
  );
}

function sortOffers(offers: ?(ExchangeOffer[])): ?(ExchangeOffer[]) {
  if (!offers) return null;

  return orderBy(offers, [(offer) => offer.toAmount.toNumber()], ['desc']);
}

const FormWrapper = styled.View`
  padding: 24px 20px 40px;
`;

const TouchableSwapIcon = styled.TouchableOpacity`
  width: 100%;
  margin: 10px 0 20px;
  align-items: center;
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
  margin-top: 40px;
`;
