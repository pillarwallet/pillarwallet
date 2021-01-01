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
import React, { useEffect, useState } from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { constants as ethersConstants } from 'ethers';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import t from 'translations/translate';

// components
import { ScrollWrapper, Spacing } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Toast from 'components/Toast';

// constants
import { defaultFiatCurrency, ETH, BTC, WBTC } from 'constants/assetsConstants';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// actions
import { setDismissTransactionAction, getWbtcGatewayAddressAction } from 'actions/exchangeActions';
import { estimateTransactionAction } from 'actions/transactionEstimateActions';

// utils
import { formatAmountDisplay, formatFiat } from 'utils/common';
import {
  isEnoughBalanceForTransactionFee,
  getAssetDataByAddress,
  getAssetsAsList,
  getRate,
  getBalance,
} from 'utils/assets';
import { getOfferProviderLogo, isWethConvertedTx } from 'utils/exchange';
import { isProdEnv } from 'utils/environment';
import { showWbtcErrorToast } from 'services/wbtcCafe';

// types
import type { Asset, AssetData, Assets, Balances, Rates } from 'models/Asset';
import type { OfferOrder } from 'models/Offer';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { WBTCGatewayAddressParams, WBTCGatewayAddressResponse, WBTCFeesWithRate } from 'models/WBTC';

// selectors
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';

// partials
import ExchangeScheme from './ExchangeScheme';
import WBTCCafeInfo from './WBTCCafeInfo';
import ConfirmationTable from './ConfirmationTable';

type Props = {
  navigation: NavigationScreenProp<*>,
  rates: Rates,
  baseFiatCurrency: ?string,
  exchangeSupportedAssets: Asset[],
  balances: Balances,
  executingExchangeTransaction: boolean,
  setDismissTransaction: () => void,
  theme: Theme,
  accountAssets: Assets,
  supportedAssets: Asset[],
  isOnline: boolean,
  estimateTransaction: (recipient: string, value: number, data?: string, assetData?: AssetData) => void,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  getWbtcGatewayAddress: (params: WBTCGatewayAddressParams) => void;
};

const MainWrapper = styled.View`
  padding: 48px 0 64px;
  flex: 1;
  justify-content: center;
`;

// already passed as mixed from other screen, TODO: fix the whole flow?
type MixedOfferOrder = $Shape<OfferOrder & TokenTransactionPayload>;

const ExchangeConfirmScreen = ({
  executingExchangeTransaction,
  navigation,
  balances,
  baseFiatCurrency,
  rates,
  theme,
  isOnline,
  setDismissTransaction,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  estimateTransaction,
  accountAssets,
  supportedAssets,
  getWbtcGatewayAddress,
}: Props) => {
  const wbtcData: WBTCGatewayAddressParams = navigation.getParam('wbtcTxData');
  const wbtcEstimationData: ?WBTCFeesWithRate = navigation.getParam('wbtcEstData');
  const isWbtcCafe = !!wbtcData;
  const [gatewayAddress, setGatewayAddress] = useState<string>('');
  const [wbtcError, setWbtcError] = useState<boolean>(false);

  useEffect(() => {
    if (!isWbtcCafe && !executingExchangeTransaction) navigation.goBack();
  }, [executingExchangeTransaction]);

  const offerOrder: MixedOfferOrder = navigation.getParam('offerOrder', {});

  const {
    fromAsset,
    toAsset,
    setTokenAllowance,
    provider,
    receiveQuantity,
    payQuantity,
    decimals,
    amount,
    symbol,
    to: recipient,
    contractAddress,
    data,
  } = offerOrder;

  const fetchTransactionEstimate = () => {
    const isConvertedTx = isWethConvertedTx(symbol, contractAddress);

    // for WETH converted txs on homestead, we need to provide ETH data or else estimation is always 0$
    const contractAddressForEstimation = isProdEnv && isConvertedTx
      ? ethersConstants.AddressZero
      : contractAddress;

    const estimateAsset = getAssetDataByAddress(
      getAssetsAsList(accountAssets),
      supportedAssets,
      contractAddressForEstimation,
    );

    const estimateAssetData = {
      contractAddress: estimateAsset.address,
      token: estimateAsset.symbol,
      decimals: estimateAsset.decimals,
    };

    estimateTransaction(recipient, Number(amount || 0), data, estimateAssetData);
  };

  const fetchWbtcAddress = async () => {
    const resp: WBTCGatewayAddressResponse = await getWbtcGatewayAddress(wbtcData);
    if (resp?.result === 'success' && resp?.gatewayAddress) {
      setGatewayAddress(resp?.gatewayAddress || '');
    } else {
      setWbtcError(true);
      showWbtcErrorToast();
    }
  };

  useEffect(() => {
    if (isWbtcCafe) { fetchWbtcAddress(); } else { fetchTransactionEstimate(); }
  }, []);

  const onConfirmTransactionPress = () => {
    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotExchangeAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    const transactionPayload = { ...offerOrder, gasToken, txFeeInWei };

    if (setTokenAllowance) {
      transactionPayload.extra = {
        allowance: {
          provider,
          fromAssetCode: fromAsset.code || fromAsset.symbol,
          toAssetCode: toAsset.code || fromAsset.symbol,
        },
      };
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
      transactionType: EXCHANGE,
    });
  };


  const handleBack = () => {
    if (executingExchangeTransaction) {
      setDismissTransaction();
    } else {
      navigation.goBack();
    }
  };

  if (!isWbtcCafe && !executingExchangeTransaction) return null;

  const fromAssetCode = isWbtcCafe ? BTC : fromAsset.code || fromAsset.symbol;
  const toAssetCode = isWbtcCafe ? WBTC : toAsset.code || toAsset.symbol;

  const feeSymbol = get(feeInfo?.gasToken, 'symbol', ETH);
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const isEnoughForFee = !feeInfo || isEnoughBalanceForTransactionFee(balances, {
    amount,
    decimals,
    symbol,
    txFeeInWei: feeInfo.fee,
    gasToken: feeInfo.gasToken,
  });

  const errorMessage = isEnoughForFee
    ? estimateErrorMessage
    : t('error.transactionFailed.notEnoughForGasWithBalance', {
      token: feeSymbol,
      balance: getBalance(balances, feeSymbol),
    });

  const toQuantity = isWbtcCafe ? wbtcEstimationData?.estimate || 0 : receiveQuantity;

  const formattedReceiveAmount = formatAmountDisplay(toQuantity);

  const receiveAmountInFiat = parseFloat(toQuantity) * getRate(rates, toAssetCode, fiatCurrency);
  const formattedReceiveAmountInFiat = formatFiat(receiveAmountInFiat, fiatCurrency);

  const providerLogo = getOfferProviderLogo(provider, theme, 'vertical');

  const getTable = () => (
    <ConfirmationTable
      errorMessage={errorMessage}
      onPress={onConfirmTransactionPress}
      offerOrder={offerOrder}
      isEstimating={isEstimating}
      isOnline={isOnline}
      feeInfo={feeInfo}
    />
  );

  const getWbtcInfoComponent = () => (
    <WBTCCafeInfo
      extendedInfo
      wbtcData={wbtcEstimationData}
      amount={wbtcData.amount}
      address={gatewayAddress}
      error={wbtcError}
      navigation={navigation}
    />
  );

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('exchangeContent.title.confirmScreen') }],
        customOnBack: handleBack,
      }}
      inset={{ bottom: 'never' }}
    >
      <ScrollWrapper contentContainerStyle={{ minHeight: '100%' }}>
        <MainWrapper>
          <ExchangeScheme
            fromValue={isWbtcCafe ? wbtcData.amount : payQuantity}
            fromAssetCode={fromAssetCode}
            toValue={formattedReceiveAmount}
            toValueInFiat={formattedReceiveAmountInFiat}
            toAssetCode={toAssetCode}
            imageSource={providerLogo}
          />
          <Spacing h={36} />
          {isWbtcCafe ? getWbtcInfoComponent() : getTable()}
        </MainWrapper>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  session: { data: { isOnline } },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  exchange: { data: { executingTransaction: executingExchangeTransaction }, exchangeSupportedAssets },
  assets: { supportedAssets },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  executingExchangeTransaction,
  exchangeSupportedAssets,
  supportedAssets,
  isOnline,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  accountAssets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setDismissTransaction: () => dispatch(setDismissTransactionAction()),
  getWbtcGatewayAddress: (params) => dispatch(getWbtcGatewayAddressAction(params)),
  estimateTransaction: (
    recipient: string,
    value: number,
    data?: string,
    assetData?: AssetData,
  ) => dispatch(estimateTransactionAction(recipient, value, data, assetData)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeConfirmScreen));
