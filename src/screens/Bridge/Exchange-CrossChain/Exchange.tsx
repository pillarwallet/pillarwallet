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
import { Keyboard, Platform } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { isEmpty, maxBy } from 'lodash';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Actions
import { fetchGasThresholds } from 'redux/actions/gas-threshold-actions';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Icon from 'components/core/Icon';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';
import Banner from 'components/Banner/Banner';

// Constants
import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { isLogV2AppEvents } from 'utils/environment';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
import { appendFeeCaptureTransactionIfNeeded } from 'utils/exchange';
import { getAccountAddress, getAccountType } from 'utils/accounts';
import { hitSlop50w20h } from 'utils/common';
import { currentDate, currentTime } from 'utils/date';
import { getActiveScreenName } from 'utils/navigation';
import { getAssetRateInFiat } from 'utils/rates';

// Actions
import { appsFlyerlogEventAction } from 'actions/analyticsActions';
import { fetchSingleChainAssetRatesAction } from 'actions/ratesActions';

// Types
import type { AssetOption } from 'models/Asset';
import type { ExchangeOffer } from 'models/Exchange';
import type { Chain } from 'models/Chain';

// Selectors
import { useActiveAccount, useChainRates, useFiatCurrency } from 'selectors';

// Local
import FromAssetSelector from './FromAssetSelector';
import ToAssetSelector from './ToAssetSelector';
import OfferCard from './OfferCard';
import {
  useFromAssets,
  useToAssets,
  useOffersQuery,
  sortingOffersToGasFee,
  sortOffers,
  useGasFeeAssets,
} from './utils';
import GasFeeAssetSelection from './GasFeeAssetSelection';

interface Props {
  fetchExchangeTitle: (val: string) => void;
}

function Exchange({ fetchExchangeTitle }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const activeAccount = useActiveAccount();
  const fromInputRef: any = React.useRef();
  const screenName = getActiveScreenName(navigation);

  const initialChain: Chain = navigation.getParam('chain');
  const initialFromAddress: string =
    navigation.getParam('fromAssetAddress') || nativeAssetPerChain[initialChain]?.address;
  const initialToAddress: string = navigation.getParam('toAssetAddress');

  const [chain, setChain] = React.useState(initialChain);
  const [fromAddress, setFromAddress] = React.useState(initialFromAddress);
  const [toAddress, setToAddress] = React.useState(initialToAddress);
  const [sortOffersList, setSortOfferList] = React.useState([]);
  const [, setRenderItem] = React.useState(null);

  const [faileEstimateOffers, setFailEstimateOffers] = React.useState(0);

  const [fromValue, setFromValue] = React.useState(null);
  const [debouncedFromValue] = useDebounce(fromValue, 500);

  const [gasFeeAsset, setGasFeeAsset] = React.useState<AssetOption | null>(null);

  const fromOptions = useFromAssets();
  const toOptions = useToAssets(chain);

  const gasFeeAssets = useGasFeeAssets(chain);

  const chainConfig = useChainConfig(chain);

  const fromAsset = React.useMemo(
    () => fromOptions.find((a) => a.chain === chain && addressesEqual(a.address, fromAddress)),
    [fromOptions, fromAddress, chain],
  );

  const toAsset = React.useMemo(() => {
    const asset = toOptions.find((a) => a.chain === chain && addressesEqual(a.address, toAddress));
    return asset;
  }, [toOptions, toAddress, chain]);

  const rates = useChainRates(chain);
  const currency = useFiatCurrency();
  const rate = getAssetRateInFiat(rates, toAsset?.address, currency);

  const offersQuery = useOffersQuery(chain, fromAsset, toAsset, debouncedFromValue);
  const offers = sortOffers(offersQuery.data);

  React.useEffect(() => {
    dispatch(fetchGasThresholds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (isLogV2AppEvents() && fromAsset && toAsset && activeAccount) {
      dispatch(
        appsFlyerlogEventAction(`exchange_pair_selected_${fromAsset?.symbol}_${toAsset?.symbol}`, {
          tokenPair: `${fromAsset?.symbol}_${toAsset?.symbol}`,
          chain: `${fromAsset?.chain}`,
          amount_swapped: fromValue,
          date: currentDate(),
          time: currentTime(),
          address: activeAccount.id,
          platform: Platform.OS,
          walletType: getAccountType(activeAccount),
        }),
      );
    }
  }, [dispatch, fromAsset, toAsset, activeAccount, fromValue]);

  const handleSelectFromAsset = (asset: AssetOption) => {
    setChain(asset.chain);
    setFromAddress(asset.address);
    if (chain !== asset.chain) {
      setToAddress(null);
    }
  };

  const handleSelectToAsset = (asset: AssetOption) => {
    setToAddress(asset.address);
    dispatch(fetchSingleChainAssetRatesAction(asset.chain, asset));
  };

  const handleOfferPress = async (selectedOffer: ExchangeOffer) => {
    if (!activeAccount) {
      // shouldn't happen
      Toast.show({
        message: t('toast.somethingWentWrong'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const offer = await appendFeeCaptureTransactionIfNeeded(selectedOffer, getAccountAddress(activeAccount));
    offer.gasFeeAsset = gasFeeAsset;
    navigation.navigate(EXCHANGE_CONFIRM, { offer });
  };

  const onChangeSortingOffers = (sortOffer) => {
    setRenderItem(sortOffer);
    const index = sortOffersList?.findIndex((res) => res?.provider === sortOffer.provider);
    if (index !== -1) sortOffersList.splice(index, 1);
    sortOffersList.push(sortOffer);
  };

  const allowSwap = !!toAsset && fromOptions.some((o) => o.chain === chain && addressesEqual(o.address, toAddress));

  const handleSwapAssets = () => {
    if (!allowSwap) return;

    // Needed to update keyboard accessory view (add/remove 100% option)
    Keyboard.dismiss();
    setFromAddress(toAddress);
    setToAddress(fromAddress);
    setFromValue(null);
  };

  const toValue = maxBy(offers, (offer: any) => offer.toAmount)?.toAmount.precision(6);
  const customTitle = !chain
    ? t('exchangeContent.title.initialExchange')
    : t('exchangeContent.title.exchange', { chain: chainConfig.titleShort });

  React.useEffect(() => {
    fetchExchangeTitle && fetchExchangeTitle(customTitle);
  }, [chain, customTitle, fetchExchangeTitle, fromAddress, toAddress]);

  React.useEffect(() => {
    if (!fromInputRef || fromValue) return;
    fromInputRef.current?.focus();
  }, [fromAsset, toAsset]);

  const showLoading = offersQuery.isFetching;
  const showEmptyState = !offers?.length && !offersQuery.isIdle && !offersQuery.isFetching;

  React.useEffect(() => {
    if (showLoading) {
      setFailEstimateOffers(0);
    }
  }, [showLoading]);

  React.useEffect(() => {
    setSortOfferList([]);
  }, [fromValue, toAddress, fromAddress, chain]);

  const showOfferEstimateFailState = faileEstimateOffers === offers?.length;
  const ratesNotFound = toAsset && fromValue ? rate === 0 : false;

  const sortedOffers = isEmpty(sortOffersList) ? offers : sortingOffersToGasFee(sortOffersList);

  return (
    <Container>
      <Content onScroll={() => Keyboard.dismiss()}>
        <Banner screenName={screenName} bottomPosition={false} />
        <FromAssetSelector
          title={t('assetSelector.choose_token_swap')}
          assets={fromOptions}
          selectedAsset={fromAsset}
          onSelectAsset={handleSelectFromAsset}
          value={fromValue}
          onValueChange={setFromValue}
          editable={!!fromAsset}
          valueInputRef={fromInputRef}
        />

        <TouchableSwapIcon onPress={handleSwapAssets} disabled={!allowSwap} hitSlop={hitSlop50w20h}>
          {toAsset ? <Icon name="arrow-up-down" /> : <Spacing h={24} />}
        </TouchableSwapIcon>

        <ToAssetSelector
          chain={chain}
          title={t('assetSelector.choose_token_swap')}
          assets={toOptions}
          selectedAsset={toAsset}
          onSelectAsset={handleSelectToAsset}
          value={toValue}
          isFetching={showLoading}
          searchTokenList={toOptions}
        />

        <Spacing h={20} />

        <Banner screenName={screenName} bottomPosition />

        <Spacing h={10} />

        {gasFeeAssets && toAddress && fromValue && (
          <GasFeeAssetSelection
            chain={chain}
            assets={gasFeeAssets}
            selectAsset={gasFeeAsset}
            onSelectAsset={setGasFeeAsset}
          />
        )}

        <Spacing h={20} />

        {showLoading && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}

        {!showLoading &&
          !ratesNotFound &&
          sortedOffers?.map((offer) => (
            <OfferCard
              key={offer.provider}
              offer={offer}
              disabled={false}
              isLoading={false}
              gasFeeAsset={gasFeeAsset}
              onPress={() => handleOfferPress(offer)}
              onFetchSortingOfferInfo={onChangeSortingOffers}
              onEstimateFail={() => {
                setFailEstimateOffers(faileEstimateOffers + 1);
              }}
            />
          ))}

        {(showEmptyState || showOfferEstimateFailState || (ratesNotFound && !showLoading)) && (
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

const TouchableSwapIcon = styled.TouchableOpacity`
  margin: 8px 0 8px;
  align-self: center;
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
  margin-top: 40px;
`;
