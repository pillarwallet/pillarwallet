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
import { FlatList } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// actions
import {
  setDismissTransactionAction,
  setExecutingTransactionAction,
  setTokenAllowanceAction,
  takeOfferAction,
} from 'actions/exchangeActions';
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// components
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import OfferCard from 'components/OfferCard/OfferCard';
import Toast from 'components/Toast';
import Modal from 'components/Modal';

// constants
import { EXCHANGE } from 'constants/exchangeConstants';
import { EXCHANGE_CONFIRM, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Allowance, Offer } from 'models/Offer';
import type { NavigationScreenProp } from 'react-navigation';
import type { Theme } from 'models/Theme';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Asset, AssetData, Balances, Rates } from 'models/Asset';
import type { SessionData } from 'models/Session';

//  selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/smartWallet';

// utils
import { getOfferProviderLogo, getCryptoProviderName } from 'utils/exchange';
import { formatAmountDisplay } from 'utils/common';
import { spacing } from 'utils/variables';

// partials
import ExchangeStatus from './ExchangeStatus';
import { calculateAmountToBuy, getAvailable } from './utils';
import AssetEnableModal from './AssetEnableModal';


export type EnableData = {
  providerName: string,
  assetSymbol: string,
  assetIcon: string,
};

type AllowanceResponse = {
  payToAddress: string,
  transactionObj: { data: string },
};

type Props = {
  navigation: NavigationScreenProp<*>,
  offers: Offer[],
  takeOffer: (Asset, Asset, number, string, string, () => void) => void,
  setExecutingTransaction: () => void,
  setTokenAllowance: (string, string, (AllowanceResponse) => Promise<void>) => void,
  exchangeAllowances: Allowance[],
  theme: Theme,
  showEmptyMessage: boolean,
  isExchangeActive: boolean,
  disableNonFiatExchange: boolean,
  setFromAmount: (string) => void,
  fromAmount: string,
  exchangeSupportedAssets: Asset[],
  baseFiatCurrency: ?string,
  rates: Rates,
  setDismissTransaction: () => void,
  balances: Balances,
  session: SessionData,
  activeAccountAddress: string,
  useGasToken: boolean,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  estimateTransaction: (recipientAddress: string, value: number, data: ?string, assetData?: AssetData) => void,
  resetEstimateTransaction: () => void,
};

type State = {
  pressedOfferId: string, // offer id will be passed to prevent double clicking
  pressedTokenAllowanceId: string,
  enablePayload: ?$Shape<TokenTransactionPayload>,
};


const ListHeader = styled.View`
  width: 100%;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 0 ${spacing.layoutSides}px;
`;

const ESWrapper = styled.View`
  width: 100%;
  align-items: center;
  padding: 0 ${spacing.layoutSides}px;
`;

const OfferCardWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px;
`;


function getCardAdditionalButtonData(additionalData) {
  const {
    offer,
    minOrMaxNeeded,
    isBelowMin,
    storedAllowance,
    allowanceSet,
    pressedTokenAllowanceId,
    setFromAmount,
    onSetTokenAllowancePress,
    isEstimating,
  } = additionalData;

  const {
    _id: offerId,
    minQuantity,
    maxQuantity,
    fromAsset,
  } = offer;

  const { code: fromAssetCode } = fromAsset;
  const isSetAllowancePressed = pressedTokenAllowanceId === offerId;
  const minOrMaxAmount = formatAmountDisplay(isBelowMin ? minQuantity : maxQuantity);

  if (minOrMaxNeeded) {
    return {
      title: isBelowMin
        ? t('minTokenValue', { value: minOrMaxAmount, token: fromAssetCode })
        : t('maxTokenValue', { value: minOrMaxAmount, token: fromAssetCode }),
      onPress: () => setFromAmount(isBelowMin ? minQuantity : maxQuantity),
    };
  } else if (!allowanceSet) {
    return {
      title: storedAllowance ? t('label.pending') : t('exchangeContent.button.allowExchange'),
      onPress: () => onSetTokenAllowancePress(offer),
      disabled: isSetAllowancePressed || !!storedAllowance,
      isLoading: isSetAllowancePressed || isEstimating,
    };
  }
  return null;
}

class ExchangeOffers extends React.Component<Props, State> {
  state = {
    pressedOfferId: '',
    pressedTokenAllowanceId: '',
    enablePayload: null,
  };

  onSetTokenAllowancePress = (offer: Offer) => {
    const { setTokenAllowance } = this.props;
    const { _id, provider, fromAsset } = offer;
    const { address: fromAssetAddress } = fromAsset;
    this.setState({ pressedTokenAllowanceId: _id }, () => {
      setTokenAllowance(
        fromAssetAddress,
        provider,
        response => this.setTokenAllowanceCallback(response, offer),
      );
    });
  };

  setTokenAllowanceCallback = async (response: Object, offer: Offer) => {
    const {
      exchangeSupportedAssets,
      setExecutingTransaction,
      isEstimating,
      estimateTransaction,
      resetEstimateTransaction,
    } = this.props;

    if (isEstimating) return;

    const { provider, fromAsset, toAsset } = offer;
    const {
      address: fromAssetAddress, code: fromAssetCode, symbol: fromAssetSymbol, decimals,
    } = fromAsset;
    const { code: toAssetCode, symbol: toAssetSymbol } = toAsset;

    if (isEmpty(response)) {
      this.setState({ pressedTokenAllowanceId: '' }); // reset set allowance button to be enabled
      return;
    }

    setExecutingTransaction();
    const {
      payToAddress,
      transactionObj: { data } = {},
    } = response;

    const assetToEnable =
      exchangeSupportedAssets.find(({ symbol }) => symbol === fromAssetCode || symbol === fromAssetSymbol) || {};
    const { symbol: assetSymbol, iconUrl: assetIcon } = assetToEnable;

    const providerName = getCryptoProviderName(provider);

    resetEstimateTransaction();
    estimateTransaction(payToAddress, 0, data);

    const transactionPayload = {
      amount: 0,
      to: payToAddress,
      symbol: fromAssetCode || fromAssetSymbol,
      contractAddress: fromAssetAddress || '',
      decimals: parseInt(decimals, 10) || 18,
      data,
      extra: {
        allowance: {
          provider,
          fromAssetCode: fromAssetCode || fromAssetSymbol,
          toAssetCode: toAssetCode || toAssetSymbol,
        },
      },
    };

    const enableData = {
      providerName,
      assetSymbol,
      assetIcon,
    };

    this.setState({
      pressedTokenAllowanceId: '',
      enablePayload: { ...transactionPayload },
    }, () => {
      this.openEnableAssetModal(enableData);
    });
  };

  openEnableAssetModal = (enableData: EnableData) => {
    Modal.open(() => (
      <AssetEnableModal
        onModalHide={this.props.setDismissTransaction}
        onEnable={this.enableAsset}
        enableData={enableData}
        transactionPayload={this.state.enablePayload}
      />
    ));
  }

  enableAsset = () => {
    const { enablePayload } = this.state;
    const { navigation, feeInfo } = this.props;

    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotEnableAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    const transactionPayload = {
      ...enablePayload,
      txFeeInWei,
      gasToken,
    };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
      transactionType: EXCHANGE,
    });
  };

  onOfferPress = (offer: Offer) => {
    const {
      navigation,
      takeOffer,
      setExecutingTransaction,
      fromAmount,
      resetEstimateTransaction,
    } = this.props;

    const {
      _id,
      provider,
      fromAsset,
      toAsset,
      askRate,
      trackId = '',
    } = offer;
    const amountToSell = parseFloat(fromAmount);
    const amountToBuy = calculateAmountToBuy(askRate, amountToSell);

    this.setState({ pressedOfferId: _id }, () => {
      takeOffer(fromAsset, toAsset, amountToSell, provider, trackId, order => {
        resetEstimateTransaction();
        this.setState({ pressedOfferId: '' }); // reset offer card button loading spinner
        if (isEmpty(order)) return;
        setExecutingTransaction();
        navigation.navigate(EXCHANGE_CONFIRM, {
          offerOrder: {
            ...order,
            receiveQuantity: amountToBuy, // this value should be provided by exchange, currently returning 0,
            // hence we overwrite it with our calculation
            provider,
          },
        });
      });
    });
  };

  renderOffers = ({ item: offer }, disableNonFiatExchange: boolean) => {
    const {
      pressedOfferId,
      pressedTokenAllowanceId,
    } = this.state;
    const {
      exchangeAllowances,
      theme,
      fromAmount,
      setFromAmount,
      isEstimating,
    } = this.props;

    const {
      _id: offerId,
      minQuantity,
      maxQuantity,
      askRate,
      toAsset,
      fromAsset,
      provider: offerProvider,
    } = offer;
    let { allowanceSet = true } = offer;

    const toAssetCode = toAsset?.code || toAsset?.symbol;
    const fromAssetCode = fromAsset?.code || fromAsset?.symbol;

    let storedAllowance;
    if (!allowanceSet) {
      storedAllowance = exchangeAllowances.find(
        ({ provider, fromAssetCode: _fromAssetCode, toAssetCode: _toAssetCode }) => _fromAssetCode === fromAssetCode
          && _toAssetCode === toAssetCode && provider === offerProvider,
      );
      allowanceSet = storedAllowance && storedAllowance.enabled;
    }

    const available = getAvailable(minQuantity, maxQuantity, askRate);
    const amountToBuy = calculateAmountToBuy(askRate, fromAmount);
    const isTakeOfferPressed = pressedOfferId === offerId;
    const providerLogo = getOfferProviderLogo(offerProvider, theme, 'horizontal');
    const amountToBuyString = formatAmountDisplay(amountToBuy);

    const amountToSell = parseFloat(fromAmount);
    const minQuantityNumeric = parseFloat(minQuantity);
    const maxQuantityNumeric = parseFloat(maxQuantity);
    const isBelowMin = minQuantityNumeric !== 0 && amountToSell < minQuantityNumeric;
    const isAboveMax = maxQuantityNumeric !== 0 && amountToSell > maxQuantityNumeric;

    const minOrMaxNeeded = isBelowMin || isAboveMax;
    const isTakeButtonDisabled = !!minOrMaxNeeded
      || isTakeOfferPressed
      || !allowanceSet;

    const additionalData = {
      offer,
      minOrMaxNeeded,
      isBelowMin,
      allowanceSet,
      storedAllowance,
      pressedTokenAllowanceId,
      setFromAmount,
      onSetTokenAllowancePress: this.onSetTokenAllowancePress,
      isEstimating,
    };

    return (
      <OfferCardWrapper>
        <OfferCard
          isDisabled={isTakeButtonDisabled || disableNonFiatExchange}
          onPress={() => this.onOfferPress(offer)}
          labelTop={t('exchangeContent.label.exchangeRate')}
          valueTop={formatAmountDisplay(askRate)}
          cardImageSource={providerLogo}
          labelBottom={t('exchangeContent.label.availableAmount')}
          valueBottom={available}
          cardButton={{
            title: t('tokenValue', { value: amountToBuyString, token: toAssetCode }),
            onPress: () => this.onOfferPress(offer),
            disabled: isTakeButtonDisabled || disableNonFiatExchange,
            isLoading: isTakeOfferPressed,
          }}
          additionalCardButton={getCardAdditionalButtonData(additionalData)}
        />
      </OfferCardWrapper>
    );
  };

  render() {
    const {
      offers,
      disableNonFiatExchange,
      isExchangeActive,
      showEmptyMessage,
    } = this.props;

    const reorderedOffers = offers.sort((a, b) => (new BigNumber(b.askRate)).minus(a.askRate).toNumber());

    return (
      <React.Fragment>
        <FlatList
          data={reorderedOffers}
          keyExtractor={(item) => item._id}
          style={{ width: '100%', flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            width: '100%',
            paddingVertical: 10,
            flexGrow: 1,
          }}
          renderItem={(props) => this.renderOffers(props, disableNonFiatExchange)}
          ListHeaderComponent={(
            <ListHeader>
              <ExchangeStatus isVisible={isExchangeActive} />
            </ListHeader>
          )}
          ListEmptyComponent={!!showEmptyMessage && (
            <ESWrapper style={{ marginTop: '15%', marginBottom: spacing.large }}>
              <EmptyStateParagraph
                title={t('exchangeContent.emptyState.noOffers.title')}
                bodyText={t('exchangeContent.emptyState.noOffers.paragraph')}
                large
                wide
              />
            </ESWrapper>
          )}
        />
      </React.Fragment>
    );
  }
}


const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  exchange: {
    data: {
      offers,
      allowances: exchangeAllowances,
    },
    exchangeSupportedAssets,
  },
  rates: { data: rates },
  session: { data: session },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  offers,
  exchangeAllowances,
  exchangeSupportedAssets,
  rates,
  session,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccountAddress: activeAccountAddressSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setExecutingTransaction: () => dispatch(setExecutingTransactionAction()),
  setDismissTransaction: () => dispatch(setDismissTransactionAction()),
  setTokenAllowance: (fromAssetAddress, provider, callback) => dispatch(
    setTokenAllowanceAction(fromAssetAddress, provider, callback),
  ),
  takeOffer: (fromAsset, toAsset, fromAmount, provider, trackId, callback) => dispatch(
    takeOfferAction(fromAsset, toAsset, fromAmount, provider, trackId, callback),
  ),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  estimateTransaction: (recipientAddress: string, value: number, data: ?string, assetData?: AssetData) => dispatch(
    estimateTransactionAction(recipientAddress, value, data, assetData),
  ),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeOffers));
