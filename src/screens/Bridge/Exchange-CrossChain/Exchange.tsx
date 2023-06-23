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
import { exchangeGasFeeAction } from 'actions/etherspotActions';
import { appsFlyerlogEventAction } from 'actions/analyticsActions';
import { fetchSingleChainAssetRatesAction } from 'actions/ratesActions';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Icon from 'components/core/Icon';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';
import Banner from 'components/Banner/Banner';
import Text from 'components/core/Text';
import SwapButton from 'components/legacy/Button';

// Constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';
import { CHAIN } from 'constants/chainConstants';
import { EXCHANGE_PROVIDER, RESET_EXCHANGE_GAS_FEE_INFO } from 'constants/exchangeConstants';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { isLogV2AppEvents } from 'utils/environment';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
import { getAccountType, getAccountAddress } from 'utils/accounts';
import { hitSlop50w20h } from 'utils/common';
import { currentDate, currentTime } from 'utils/date';
import { getActiveScreenName } from 'utils/navigation';
import { getAssetRateInFiat } from 'utils/rates';
import { mapTransactionsToTransactionPayload, showTransactionRevertedToast } from 'utils/transactions';
import { useThemeColors } from 'utils/themes';

// Types
import type { AssetOption } from 'models/Asset';
import type { ExchangeOffer } from 'models/Exchange';
import type { Chain } from 'models/Chain';
import type { TransactionPayload } from 'models/Transaction';

// Selectors
import { useExchangeGasFee, useActiveAccount, useChainRates, useFiatCurrency } from 'selectors';

// Hooks
import { useTransactionFeeCheck } from 'hooks/transactions';

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
  getSortingValue,
  appendFeeCaptureTransactionIfNeeded,
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
  const colors = useThemeColors();
  const gasFeeList = useExchangeGasFee();

  const isEstimaing = gasFeeList?.find((feeInfo) => feeInfo.isEstimating);

  const initialChain: Chain = navigation.getParam('chain');
  const initialFromAddress: string =
    navigation.getParam('fromAssetAddress') || nativeAssetPerChain[initialChain]?.address;
  const initialToAddress: string = navigation.getParam('toAssetAddress');

  const [chain, setChain] = React.useState(initialChain);
  const [fromAddress, setFromAddress] = React.useState(initialFromAddress);
  const [toAddress, setToAddress] = React.useState(initialToAddress);
  const [sortOffersList, setSortOfferList] = React.useState([]);
  const [renderItem, setRenderItem] = React.useState(null);

  const [selectedProvider, setSelectedProvider] = React.useState('');
  const [pressToSelectedProvider, setPressToSelectedProvider] = React.useState('');

  const [failedEstimateOffers, setFailEstimateOffers] = React.useState(0);
  const [hideAllOffers, setHideAllOffers] = React.useState(false);
  const [showBestOffer, setShowBestOffer] = React.useState(true);

  const [fromValue, setFromValue] = React.useState(null);
  const [debouncedFromValue] = useDebounce(fromValue, 500);

  const [gasFeeAsset, setGasFeeAsset] = React.useState<AssetOption | null>(null);

  const [loading, setLoading] = React.useState(false);

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
    setSelectedProvider(selectedOffer.provider);
    setPressToSelectedProvider(selectedOffer.provider);

    setHideAllOffers(true);

    const offerWithFee = await appendFeeCaptureTransactionIfNeeded(selectedOffer, getAccountAddress(activeAccount));
    dispatch(
      exchangeGasFeeAction(offerWithFee, gasFeeAsset, () => {
        setHideAllOffers(false);
      }),
    );
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

  const toValue = isEmpty(selectedProvider)
    ? maxBy(offers, (offer: any) => offer.toAmount)?.toAmount.precision(6)
    : offers?.find((offer) => offer.provider === selectedProvider)?.toAmount.precision(6);
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
      setSortOfferList([]);
    }
  }, [showLoading]);

  React.useEffect(() => {
    if (gasFeeAsset) {
      setHideAllOffers(false);
    }
  }, [gasFeeAsset]);

  React.useEffect(() => {
    setSortOfferList([]);
    setHideAllOffers(false);
    setShowBestOffer(true);
    setPressToSelectedProvider('');
    setSelectedProvider('');
    dispatch({ type: RESET_EXCHANGE_GAS_FEE_INFO });
  }, [fromValue, toAddress, fromAddress, chain, gasFeeAsset]);

  const showOfferEstimateFailState = failedEstimateOffers === offers?.length;
  const ratesNotFound = toAsset && fromValue ? rate === 0 : false;

  const sortedOffers: ExchangeOffer[] = React.useMemo(() => {
    if (isEmpty(sortOffersList)) return offers;
    else return sortingOffersToGasFee(sortOffersList);
  }, [renderItem, gasFeeAsset, sortOffersList, offers]);

  // Use for select default best offer
  React.useEffect(() => {
    if (isEmpty(sortOffersList) || pressToSelectedProvider) return;

    const bestOffer = sortedOffers?.find((offer) => !!offer.feeInfo && offer.provider !== EXCHANGE_PROVIDER.LIFI);

    const failEstimatedFee = sortedOffers?.find((offer) => !offer.feeInfo);
    if (!failEstimatedFee) {
      setSelectedProvider(bestOffer?.provider);
    }
    if (!failEstimatedFee && showBestOffer) {
      setHideAllOffers(true);
    }
  }, [sortedOffers, sortOffersList, renderItem]);

  const exchangeOffers = React.useMemo(() => {
    if (isEmpty(sortedOffers)) return [];

    const bestOffer = sortedOffers?.find((offer) => !!offer.feeInfo && offer.provider !== EXCHANGE_PROVIDER.LIFI);

    if (hideAllOffers && selectedProvider) {
      const selectedOffer = sortedOffers?.find((offer) => !!offer.feeInfo && offer.provider === selectedProvider);
      if (selectedOffer) {
        return sortedOffers.sort((x, y) =>
          x.provider === selectedProvider ? -1 : y.provider === selectedProvider ? 1 : 0,
        );
      }
    }

    if (!!bestOffer) {
      sortedOffers.sort((x, y) => (x.provider === bestOffer.provider ? -1 : y.provider === bestOffer.provider ? 1 : 0));
    }
    return sortedOffers;
  }, [sortedOffers, offers, sortOffersList, renderItem]);

  const selectedOffer = sortedOffers?.find((offer) => offer.provider === selectedProvider);
  const validOffers = sortedOffers?.filter((offer) => !!offer.feeInfo);
  const visibleOffers = !showLoading && !ratesNotFound && !isEmpty(sortedOffers) && !showOfferEstimateFailState;

  const { errorMessage } = useTransactionFeeCheck(
    chain || CHAIN.ETHEREUM,
    selectedOffer?.feeInfo,
    fromAsset,
    selectedOffer?.fromAmount,
  );

  const confirmTransaction = async () => {
    const offerWithFee = await appendFeeCaptureTransactionIfNeeded(selectedOffer, getAccountAddress(activeAccount));

    if (!offerWithFee?.feeInfo) {
      showTransactionRevertedToast();
      return;
    }

    let transactionPayload: TransactionPayload = mapTransactionsToTransactionPayload(
      offerWithFee?.chain,
      offerWithFee.transactions,
    );
    transactionPayload = {
      ...transactionPayload,
      offer: {
        ...offerWithFee,
        gasFeeAsset,
      },
      type: TRANSACTION_TYPE.EXCHANGE,
      gasToken: gasFeeAsset,
    };

    if (activeAccount && isLogV2AppEvents) {
      dispatch(
        appsFlyerlogEventAction(`swap_completed_${fromAsset?.symbol}_${toAsset?.symbol}`, {
          tokenPair: `${fromAsset?.symbol}_${toAsset?.symbol}`,
          chain,
          amount_swapped: offerWithFee.fromAmount,
          date: currentDate(),
          time: currentTime(),
          platform: Platform.OS,
          address: toAsset.address,
          walletType: getAccountType(activeAccount),
        }),
      );
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      toAssetSymbol: toAsset.symbol,
      goBackDismiss: true,
      transactionType: TRANSACTION_TYPE.EXCHANGE,
    });
  };

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

        {(showLoading || loading) && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}

        {visibleOffers && (
          <>
            {!isEmpty(validOffers) && !loading && (
              <Text color={colors.basic010} variant="big">
                {hideAllOffers ? t('label.best_offer') : t('label.offers')}
              </Text>
            )}
            <Spacing h={8} />
            {exchangeOffers.map((offer, index) => (
              <OfferCard
                key={offer.provider}
                isSelected={offer.provider === selectedProvider}
                isVisible={hideAllOffers ? index === 0 : true}
                offer={offer}
                disabled={false}
                isLoading={showLoading}
                gasFeeAsset={gasFeeAsset}
                onPress={() => handleOfferPress(offer)}
                onFetchSortingOfferInfo={onChangeSortingOffers}
                onEstimating={setLoading}
                onEstimateFail={() => {
                  setFailEstimateOffers(failedEstimateOffers + 1);
                }}
              />
            ))}
            {validOffers?.length > 1 && !loading && (
              <Button
                onPress={() => {
                  setShowBestOffer(false);
                  setHideAllOffers(!hideAllOffers);
                }}
              >
                <Text variant="regular">
                  {hideAllOffers ? t('label.see_other_offers') : t('label.see_less_offers')}
                </Text>
              </Button>
            )}
            <Spacing h={30} />
            {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            {!isEmpty(selectedProvider) && !showLoading && !loading && (
              <SwapButton
                style={{ borderRadius: 14 }}
                disabled={!!errorMessage || isEstimaing}
                title={t('button.swap')}
                onPress={confirmTransaction}
              />
            )}
          </>
        )}

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

const Button = styled.TouchableOpacity`
  align-self: center;
`;

const ErrorMessage = styled(Text)`
  margin-bottom: 15px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
