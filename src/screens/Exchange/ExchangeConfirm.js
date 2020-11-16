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
import Button from 'components/Button';
import { BaseText } from 'components/Typography';
import Table, { TableRow, TableLabel, TableAmount, TableFee } from 'components/Table';
import Icon from 'components/Icon';
import Toast from 'components/Toast';

// constants
import { defaultFiatCurrency, ETH, BTC, WBTC } from 'constants/assetsConstants';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { EXCHANGE, ALLOWED_SLIPPAGE } from 'constants/exchangeConstants';

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
import { themedColors } from 'utils/themes';
import { isProdEnv } from 'utils/environment';

// types
import type { Asset, AssetData, Assets, Balances, Rates } from 'models/Asset';
import type { OfferOrder } from 'models/Offer';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { Theme } from 'models/Theme';
import type { WBTCGatewayAddressParams, WBTCGatewayAddressResponse, WBTCFeesWithRate } from 'models/WBTC';

// selectors
import { activeAccountSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';

// partials
import ExchangeScheme from './ExchangeScheme';
import WBTCCafeInfo from './WBTCCafeInfo';

type Props = {
  navigation: NavigationScreenProp<*>,
  rates: Rates,
  baseFiatCurrency: ?string,
  exchangeSupportedAssets: Asset[],
  balances: Balances,
  executingExchangeTransaction: boolean,
  setDismissTransaction: () => void,
  theme: Theme,
  activeAccount: ?Account,
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

const TableWrapper = styled.View`
  padding: 0 20px;
`;

const ExchangeIcon = styled(Icon)`
  color: ${themedColors.primary};
  font-size: 16px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
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
  const [wbtcGatewayAddressInfo, setWbtcGatewayAddressInfo] = useState<WBTCGatewayAddressResponse>({});

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
    if (resp?.result === 'success') {
      setWbtcGatewayAddressInfo(resp);
    } else {
      // handle fail
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

  const fromAssetCode = isWbtcCafe ? BTC : fromAsset.code;
  const toAssetCode = isWbtcCafe ? WBTC : toAsset.code;

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

  const toQuantity = isWbtcCafe ? wbtcEstimationData.estimate : receiveQuantity;

  const formattedReceiveAmount = formatAmountDisplay(toQuantity);

  const receiveAmountInFiat = parseFloat(toQuantity) * getRate(rates, toAssetCode, fiatCurrency);
  const formattedReceiveAmountInFiat = formatFiat(receiveAmountInFiat, fiatCurrency);

  const providerLogo = getOfferProviderLogo(provider, theme, 'vertical');

  const getTable = () => {
    return (
      <TableWrapper>
        <Table title={t('exchangeContent.label.exchangeDetails')}>
          <TableRow>
            <TableLabel>{t('exchangeContent.label.exchangeRate')}</TableLabel>
            <Row>
              <ExchangeIcon name="exchange" />
              <Spacing w={4} />
              <BaseText regular>
                {t('exchangeContent.label.exchangeRateLayout', {
                  rate: (parseFloat(receiveQuantity) / parseFloat(payQuantity)).toPrecision(2),
                  toAssetCode,
                  fromAssetCode,
                })}
              </BaseText>
            </Row>
          </TableRow>
          <TableRow>
            <TableLabel>{t('exchangeContent.label.maxSlippage')}</TableLabel>
            <BaseText regular> {t('percentValue', { value: ALLOWED_SLIPPAGE })}</BaseText>
          </TableRow>
        </Table>
        <Spacing h={20} />
        <Table title={t('transactions.label.fees')}>
          <TableRow>
            <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
            <TableAmount amount={0} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.totalFee')}</TableLabel>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
          </TableRow>
        </Table>
        <Spacing h={48} />
        <Button
          disabled={!isOnline || !!errorMessage || !feeInfo || isEstimating}
          onPress={onConfirmTransactionPress}
          title={isEstimating ? t('label.gettingFee') : t('button.confirm')}
        />
      </TableWrapper>
    );
  };

  const getWbtcInfoComponent = () => (
    <WBTCCafeInfo
      extendedInfo
      wbtcData={wbtcEstimationData}
      amount={wbtcData.amount}
      address={wbtcGatewayAddressInfo?.gatewayAddress}
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
  activeAccount: activeAccountSelector,
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
  ) => dispatch(estimateTransactionAction(recipient, value, null, assetData)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeConfirmScreen));
