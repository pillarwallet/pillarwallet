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
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';

// actions
import {
  authorizeWithShapeshiftAction,
  setDismissTransactionAction,
  setExecutingTransactionAction,
  setTokenAllowanceAction,
  takeOfferAction,
} from 'actions/exchangeActions';
import { fetchGasInfoAction } from 'actions/historyActions';

// components
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import OfferCard from 'components/OfferCard/OfferCard';

// constants
import { EXCHANGE, PROVIDER_SHAPESHIFT } from 'constants/exchangeConstants';
import { EXCHANGE_CONFIRM, FIAT_EXCHANGE, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH, SPEED_TYPES } from 'constants/assetsConstants';

// services
import { wyreWidgetUrl } from 'services/sendwyre';
import smartWalletService from 'services/smartWallet';
import { calculateGasEstimate } from 'services/assets';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Allowance, ExchangeProvider, FiatOffer, Offer, ProvidersMeta } from 'models/Offer';
import type { NavigationScreenProp } from 'react-navigation';
import type { Theme } from 'models/Theme';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Asset, Balances, Rates } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';
import type { SessionData } from 'models/Session';

//  selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { isActiveAccountSmartWalletSelector, useGasTokenSelector } from 'selectors/smartWallet';

// utils
import { getOfferProviderLogo, isFiatProvider, getCryptoProviderName } from 'utils/exchange';
import { formatAmountDisplay, formatFiat, formatTransactionFee } from 'utils/common';
import { spacing } from 'utils/variables';
import { getRate, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { openInAppBrowser } from 'utils/inAppBrowser';

// partials
import ExchangeStatus from './ExchangeStatus';
import { calculateAmountToBuy, getAvailable } from './utils';
import type { FormValue } from './Exchange';
import AssetEnableModal from './AssetEnableModal';


export type EnableData = {
  providerName: string,
  assetSymbol: string,
  assetIcon: string,
  feeDisplayValue: string,
  feeInFiat: string,
  isDisabled?: boolean,
};

type AllowanceResponse = {
  gasLimit: number,
  payToAddress: string,
  transactionObj: { data: string },
};

type Props = {
  navigation: NavigationScreenProp<*>,
  offers: Offer[],
  takeOffer: (string, string, number, string, string, () => void) => void,
  authorizeWithShapeshift: () => void,
  setExecutingTransaction: () => void,
  setTokenAllowance: (string, string, string, string, string, (AllowanceResponse) => Promise<void>) => void,
  exchangeAllowances: Allowance[],
  connectedProviders: ExchangeProvider[],
  providersMeta: ProvidersMeta,
  theme: Theme,
  showEmptyMessage: boolean,
  isExchangeActive: boolean,
  disableNonFiatExchange: boolean,
  setFromAmount: (string) => void,
  value: FormValue,
  exchangeSupportedAssets: Asset[],
  baseFiatCurrency: ?string,
  gasInfo: GasInfo,
  rates: Rates,
  setDismissTransaction: () => void,
  balances: Balances,
  session: SessionData,
  fetchGasInfo: () => void,
  activeAccountAddress: string,
  isSmartAccount: boolean,
  useGasToken: boolean,
};

type State = {
  shapeshiftAuthPressed: boolean,
  pressedOfferId: string, // offer id will be passed to prevent double clicking
  pressedTokenAllowanceId: string,
  isEnableAssetModalVisible: boolean,
  enableData?: ?EnableData,
  enablePayload: ?TokenTransactionPayload,
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

// const PromoWrapper = styled.View`
//   width: 100%;
//   align-items: center;
//   padding: ${spacing.large}px ${spacing.layoutSides}px;
//   margin-bottom: 30px;
// `;
//
// const PromoText = styled(BaseText)`
//   ${fontStyles.medium};
//   color: ${themedColors.secondaryText};
//   text-align: center;
// `;
//
// const PopularSwapsGridWrapper = styled.View`
//   border-top-width: 1px;
//   border-bottom-width: 1px;
//   border-color: ${themedColors.tertiary};
//   background-color: ${themedColors.card};
//   padding: ${spacing.large}px ${spacing.layoutSides}px 0;
// `;


function getCardAdditionalButtonData(additionalData) {
  const {
    offer,
    minOrMaxNeeded,
    isBelowMin,
    isShapeShift,
    shapeshiftAccessToken,
    storedAllowance,
    allowanceSet,
    shapeshiftAuthPressed,
    pressedTokenAllowanceId,
    authoriseWithShapeShift,
    setFromAmount,
    onSetTokenAllowancePress,
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
      title: `${isBelowMin ? 'Min' : 'Max'} ${minOrMaxAmount} ${fromAssetCode}`,
      onPress: () => setFromAmount(isBelowMin ? minQuantity : maxQuantity),
    };
  } else if (isShapeShift && !shapeshiftAccessToken) {
    return {
      title: 'Connect',
      onPress: authoriseWithShapeShift,
      disabled: shapeshiftAuthPressed,
    };
  } else if (!allowanceSet) {
    return {
      title: storedAllowance ? 'Pending' : 'Allow this exchange',
      onPress: () => onSetTokenAllowancePress(offer),
      disabled: isSetAllowancePressed || !!storedAllowance,
      isLoading: isSetAllowancePressed,
    };
  }
  return null;
}

class ExchangeOffers extends React.Component<Props, State> {
  state = {
    pressedOfferId: '',
    shapeshiftAuthPressed: false,
    pressedTokenAllowanceId: '',
    isEnableAssetModalVisible: false,
    enableData: null,
    enablePayload: null,
  };

  componentDidMount() {
    if (!this.props.isSmartAccount) {
      this.props.fetchGasInfo();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { session, fetchGasInfo, isSmartAccount } = this.props;
    if (prevProps.session.isOnline !== session.isOnline && session.isOnline && !isSmartAccount) {
      fetchGasInfo();
    }
  }

  onShapeshiftAuthPress = () => {
    const { authorizeWithShapeshift } = this.props;
    this.setState({ shapeshiftAuthPressed: true }, async () => {
      await authorizeWithShapeshift();
      this.setState({ shapeshiftAuthPressed: false });
    });
  };

  getSmartWalletTxFee = async (transaction): Promise<TransactionFeeInfo> => {
    const { useGasToken } = this.props;
    const defaultResponse = { fee: new BigNumber(0) };
    const estimateTransaction = {
      data: transaction.data,
      recipient: transaction.to,
      value: transaction.amount,
    };

    const estimated = await smartWalletService
      .estimateAccountTransaction(estimateTransaction)
      .then(result => buildTxFeeInfo(result, useGasToken))
      .catch(() => null);

    if (!estimated) {
      return defaultResponse;
    }

    return estimated;
  };

  onSetTokenAllowancePress = (offer: Offer) => {
    const {
      exchangeSupportedAssets,
      providersMeta,
      baseFiatCurrency,
      gasInfo,
      setTokenAllowance,
      setExecutingTransaction,
      rates,
      balances,
      isSmartAccount,
    } = this.props;

    const {
      _id,
      provider,
      fromAsset,
      toAsset,
      trackId = '',
    } = offer;
    const { address: fromAssetAddress, code: fromAssetCode, decimals } = fromAsset;
    const { address: toAssetAddress, code: toAssetCode } = toAsset;

    this.setState({ pressedTokenAllowanceId: _id }, () => {
      setTokenAllowance(fromAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, async (response) => {
        if (isEmpty(response)) {
          this.setState({ pressedTokenAllowanceId: '' }); // reset set allowance button to be enabled
          return;
        }
        setExecutingTransaction();
        const {
          payToAddress,
          transactionObj: {
            data,
          } = {},
        } = response;

        const assetToEnable = exchangeSupportedAssets.find(({ symbol }) => symbol === fromAssetCode) || {};
        const { symbol: assetSymbol, iconUrl: assetIcon } = assetToEnable;
        const providerName = getCryptoProviderName(providersMeta, provider);

        let gasToken;
        let txFeeInWei;
        let transactionPayload = {
          amount: 0,
          to: payToAddress,
          symbol: fromAssetCode,
          contractAddress: fromAssetAddress || '',
          decimals: parseInt(decimals, 10) || 18,
          data,
          extra: {
            allowance: {
              provider,
              fromAssetCode,
              toAssetCode,
            },
          },
        };

        if (isSmartAccount) {
          ({ fee: txFeeInWei, gasToken } = await this.getSmartWalletTxFee(transactionPayload));
          if (gasToken) {
            transactionPayload = { ...transactionPayload, gasToken };
          }
        } else {
          const gasPrice = gasInfo.gasPrice[SPEED_TYPES.NORMAL] || 0;
          const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
          const gasLimit = await calculateGasEstimate(transactionPayload);
          txFeeInWei = gasPriceWei.mul(gasLimit);

          transactionPayload = {
            ...transactionPayload,
            gasPrice: gasPriceWei,
            gasLimit,
            txSpeed: SPEED_TYPES.NORMAL,
          };
        }

        transactionPayload = { ...transactionPayload, txFeeInWei };

        const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
        const feeSymbol = get(gasToken, 'symbol', ETH);
        const feeDecimals = get(gasToken, 'decimals', 'ether');
        const feeNumeric = utils.formatUnits(txFeeInWei.toString(), feeDecimals);
        const feeInFiat = formatFiat(parseFloat(feeNumeric) * getRate(rates, feeSymbol, fiatCurrency), fiatCurrency);
        const feeDisplayValue = formatTransactionFee(txFeeInWei, gasToken);
        const isDisabled = !isEnoughBalanceForTransactionFee(balances, transactionPayload);

        this.setState({
          pressedTokenAllowanceId: '',
          isEnableAssetModalVisible: true,
          enableData: {
            providerName,
            assetSymbol,
            assetIcon,
            feeDisplayValue,
            feeInFiat,
            isDisabled,
          },
          enablePayload: { ...transactionPayload },
        });
      });
    });
  };

  hideEnableAssetModal = () => {
    const { setDismissTransaction } = this.props;
    setDismissTransaction();
    this.setState({ isEnableAssetModalVisible: false, enableData: null });
  };

  enableAsset = () => {
    const { enablePayload } = this.state;
    const { navigation } = this.props;
    this.hideEnableAssetModal();

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: enablePayload,
      goBackDismiss: true,
      transactionType: EXCHANGE,
    });
  };

  onOfferPress = (offer: Offer) => {
    const {
      navigation,
      takeOffer,
      setExecutingTransaction,
      value: {
        fromInput: {
          input: selectedSellAmount,
        },
      },
    } = this.props;

    const {
      _id,
      provider,
      fromAsset,
      toAsset,
      askRate,
      trackId = '',
    } = offer;
    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;
    const amountToSell = parseFloat(selectedSellAmount);
    const amountToBuy = calculateAmountToBuy(askRate, amountToSell);

    this.setState({ pressedOfferId: _id }, () => {
      takeOffer(fromAssetCode, toAssetCode, amountToSell, provider, trackId, order => {
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

  onFiatOfferPress = (offer: FiatOffer) => {
    const {
      navigation,
      value: {
        fromInput: {
          input: selectedSellAmount,
        },
      },
    } = this.props;
    const { provider } = offer;

    if (provider === 'SendWyre') {
      this.openSendWyre(selectedSellAmount, offer);
      return;
    }

    navigation.navigate(FIAT_EXCHANGE, {
      fiatOfferOrder: {
        ...offer,
        amount: selectedSellAmount,
      },
    });
  };

  openSendWyre(selectedSellAmount: string, offer: FiatOffer) {
    const { activeAccountAddress } = this.props;
    const { fromAsset, toAsset } = offer;
    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;

    const wyreUrl = wyreWidgetUrl(
      activeAccountAddress,
      toAssetCode,
      fromAssetCode,
      selectedSellAmount,
    );

    openInAppBrowser(wyreUrl);
  }

  renderOffers = ({ item: offer }, disableNonFiatExchange: boolean) => {
    const {
      pressedOfferId,
      shapeshiftAuthPressed,
      pressedTokenAllowanceId,
    } = this.state;
    const {
      exchangeAllowances,
      connectedProviders,
      providersMeta,
      theme,
      value: { fromInput },
      setFromAmount,
    } = this.props;
    const { input: selectedSellAmount } = fromInput;
    const {
      _id: offerId,
      minQuantity,
      maxQuantity,
      askRate,
      toAsset,
      fromAsset,
      provider: offerProvider,
      feeAmount,
      extraFeeAmount,
      quoteCurrencyAmount,
      offerRestricted,
    } = offer;
    let { allowanceSet = true } = offer;

    const { code: toAssetCode } = toAsset;
    const { code: fromAssetCode } = fromAsset;

    let storedAllowance;
    if (!allowanceSet) {
      storedAllowance = exchangeAllowances.find(
        ({ provider, fromAssetCode: _fromAssetCode, toAssetCode: _toAssetCode }) => _fromAssetCode === fromAssetCode
          && _toAssetCode === toAssetCode && provider === offerProvider,
      );
      allowanceSet = storedAllowance && storedAllowance.enabled;
    }

    const available = getAvailable(minQuantity, maxQuantity, askRate);
    const amountToBuy = calculateAmountToBuy(askRate, selectedSellAmount);
    const isTakeOfferPressed = pressedOfferId === offerId;
    const isShapeShift = offerProvider === PROVIDER_SHAPESHIFT;
    const providerLogo = getOfferProviderLogo(providersMeta, offerProvider, theme, 'horizontal');
    const amountToBuyString = formatAmountDisplay(amountToBuy);

    let shapeshiftAccessToken;
    if (isShapeShift) {
      ({ extra: shapeshiftAccessToken } = connectedProviders
        .find(({ id: providerId }) => providerId === PROVIDER_SHAPESHIFT) || {});
    }

    const amountToSell = parseFloat(selectedSellAmount);
    const minQuantityNumeric = parseFloat(minQuantity);
    const maxQuantityNumeric = parseFloat(maxQuantity);
    const isBelowMin = minQuantityNumeric !== 0 && amountToSell < minQuantityNumeric;
    const isAboveMax = maxQuantityNumeric !== 0 && amountToSell > maxQuantityNumeric;

    const minOrMaxNeeded = isBelowMin || isAboveMax;
    const isTakeButtonDisabled = !!minOrMaxNeeded
      || isTakeOfferPressed
      || !allowanceSet
      || (isShapeShift && !shapeshiftAccessToken);

    const isFiat = isFiatProvider(offerProvider);

    const disableFiatExchange = isFiat && (minOrMaxNeeded || !!offerRestricted);
    const disableOffer = disableNonFiatExchange || disableFiatExchange;

    const additionalData = {
      offer,
      minOrMaxNeeded,
      isBelowMin,
      isShapeShift,
      shapeshiftAccessToken,
      allowanceSet,
      storedAllowance,
      shapeshiftAuthPressed,
      pressedTokenAllowanceId,
      authoriseWithShapeShift: this.onShapeshiftAuthPress,
      setFromAmount,
      onSetTokenAllowancePress: this.onSetTokenAllowancePress,
    };

    if (isFiat) {
      return (
        <OfferCardWrapper>
          <OfferCard
            isDisabled={isTakeButtonDisabled || disableOffer}
            onPress={() => this.onFiatOfferPress(offer)}
            labelTop="Amount total"
            valueTop={`${askRate} ${fromAssetCode}`}
            cardImageSource={providerLogo}
            labelBottom="Fees total"
            valueBottom={feeAmount ?
              `${formatAmountDisplay(feeAmount + extraFeeAmount)} ${fromAssetCode}`
              : 'Will be calculated'
            }
            cardButton={{
              title: `${formatAmountDisplay(quoteCurrencyAmount)} ${toAssetCode}`,
              onPress: () => this.onFiatOfferPress(offer),
              disabled: disableFiatExchange,
              isLoading: isTakeOfferPressed,
            }}
            cardNote={offerRestricted}
            additionalCardButton={getCardAdditionalButtonData(additionalData)}
          />
        </OfferCardWrapper>
      );
    }

    return (
      <OfferCardWrapper>
        <OfferCard
          isDisabled={isTakeButtonDisabled || disableOffer}
          onPress={() => this.onOfferPress(offer)}
          labelTop="Exchange rate"
          valueTop={formatAmountDisplay(askRate)}
          cardImageSource={providerLogo}
          labelBottom="Available"
          valueBottom={available}
          cardButton={{
            title: `${amountToBuyString} ${toAssetCode}`,
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
    const { isEnableAssetModalVisible, enableData } = this.state;
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
                title="No live offers"
                bodyText="Currently no matching offers from exchange services are provided.
                                New offers may appear at any time — don’t miss it."
                large
                wide
              />
            </ESWrapper>
          )}
          // ListFooterComponentStyle={{ flex: 1, justifyContent: 'flex-end' }}
          // ListFooterComponent={
          //   <PopularSwapsGridWrapper>
          //     <SafeAreaView forceInset={{ top: 'never', bottom: 'always' }}>
          //       <MediumText medium style={{ marginBottom: spacing.medium }}>
          //           Try these popular swaps
          //       </MediumText>
          //       <HotSwapsGridList onPress={this.onSwapPress} swaps={swaps} />
          //     </SafeAreaView>
          //   </PopularSwapsGridWrapper>
          // }
        />
        <AssetEnableModal
          isVisible={isEnableAssetModalVisible}
          onModalHide={this.hideEnableAssetModal}
          onEnable={this.enableAsset}
          enableData={enableData}
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
      connectedProviders,
    },
    providersMeta,
    exchangeSupportedAssets,
  },
  history: { gasInfo },
  rates: { data: rates },
  session: { data: session },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  offers,
  exchangeAllowances,
  connectedProviders,
  providersMeta,
  exchangeSupportedAssets,
  gasInfo,
  rates,
  session,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccountAddress: activeAccountAddressSelector,
  isSmartAccount: isActiveAccountSmartWalletSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  authorizeWithShapeshift: () => dispatch(authorizeWithShapeshiftAction()),
  setExecutingTransaction: () => dispatch(setExecutingTransactionAction()),
  setDismissTransaction: () => dispatch(setDismissTransactionAction()),
  setTokenAllowance: (formAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, callback) => dispatch(
    setTokenAllowanceAction(formAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, callback),
  ),
  takeOffer: (fromAssetCode, toAssetCode, fromAmount, provider, trackId, callback) => dispatch(
    takeOfferAction(fromAssetCode, toAssetCode, fromAmount, provider, trackId, callback),
  ),
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeOffers));
