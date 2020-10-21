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
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { constants as ethersConstants } from 'ethers';
import { createStructuredSelector } from 'reselect';
import BigNumber from 'bignumber.js';
import isEqual from 'lodash.isequal';
import get from 'lodash.get';
import t from 'translations/translate';

// components
import { ScrollWrapper, Spacing } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { BaseText } from 'components/Typography';
import Table, { TableRow, TableLabel, TableAmount, TableFee } from 'components/Table';
import Icon from 'components/Icon';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { EXCHANGE, ALLOWED_SLIPPAGE } from 'constants/exchangeConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { setDismissTransactionAction } from 'actions/exchangeActions';

// utils
import {
  formatAmountDisplay,
  formatFiat,
} from 'utils/common';
import {
  isEnoughBalanceForTransactionFee,
  getAssetDataByAddress,
  getAssetsAsList,
  getRate,
  getBalance,
} from 'utils/assets';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { getOfferProviderLogo, isWethConvertedTx } from 'utils/exchange';
import { themedColors } from 'utils/themes';
import { isProdEnv } from 'utils/environment';

// services
import smartWalletService from 'services/smartWallet';

// types
import type { GasInfo } from 'models/GasInfo';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { OfferOrder } from 'models/Offer';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { Account } from 'models/Account';
import type { Theme } from 'models/Theme';

// selectors
import { activeAccountAddressSelector, activeAccountSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';
import { isActiveAccountSmartWalletSelector, useGasTokenSelector } from 'selectors/smartWallet';

// partials
import ExchangeScheme from './ExchangeScheme';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: SessionData,
  fetchGasInfo: () => void,
  gasInfo: GasInfo,
  rates: Rates,
  baseFiatCurrency: ?string,
  exchangeSupportedAssets: Asset[],
  balances: Balances,
  executingExchangeTransaction: boolean,
  setDismissTransaction: () => void,
  theme: Theme,
  activeAccountAddress: string,
  activeAccount: ?Account,
  accountAssets: Assets,
  supportedAssets: Asset[],
  isSmartAccount: boolean,
  useGasToken: boolean,
};

type State = {
  transactionSpeed: string,
  gasLimit: number,
  txFeeInfo: ?TransactionFeeInfo,
  gettingFee: boolean,
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

class ExchangeConfirmScreen extends React.Component<Props, State> {
  transactionPayload: TokenTransactionPayload;

  state = {
    txFeeInfo: null,
    gettingFee: true,
  };

  constructor(props: Props) {
    super(props);
    this.transactionPayload = props.navigation.getParam('offerOrder');
  }

  componentDidMount() {
    this.fetchTransactionEstimate();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      executingExchangeTransaction,
      navigation,
      fetchGasInfo,
      session: { isOnline },
      gasInfo,
    } = this.props;
    if (!executingExchangeTransaction) {
      navigation.goBack();
      return;
    }
    if (prevProps.session.isOnline !== isOnline && isOnline) {
      fetchGasInfo();
    }
    if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.fetchTransactionEstimate();
    }
  }

  fetchTransactionEstimate = async () => {
    this.setState({ gettingFee: true });
    const txFeeInfo = await this.getSmartWalletTxFee();
    this.setState({ txFeeInfo, gettingFee: false });
  };

  getSmartWalletTxFee = async (): Promise<TransactionFeeInfo> => {
    const { accountAssets, supportedAssets, useGasToken } = this.props;
    const defaultResponse = { fee: new BigNumber(0) };

    const {
      amount,
      to: recipient,
      contractAddress,
      data,
      symbol: fromAssetSymbol,
    } = this.transactionPayload;
    const value = Number(amount || 0);

    const isConvertedTx = isWethConvertedTx(fromAssetSymbol, contractAddress);

    // for WETH converted txs on homestead, we need to provide ETH data or else estimation is always 0$
    const contractAddressForEstimation = isProdEnv && isConvertedTx
      ? ethersConstants.AddressZero
      : contractAddress;

    const { symbol, decimals } =
      getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, contractAddressForEstimation);
    const assetData = { contractAddress: contractAddressForEstimation, token: symbol, decimals };

    let transaction = { recipient, value };
    if (data) transaction = { ...transaction, data };

    const estimated = await smartWalletService
      .estimateAccountTransaction(transaction, assetData)
      .then(result => buildTxFeeInfo(result, useGasToken))
      .catch(() => null);

    if (!estimated) {
      return defaultResponse;
    }

    return estimated;
  };

  onConfirmTransactionPress = (offerOrder) => {
    const { navigation } = this.props;
    const { txFeeInfo } = this.state;
    if (!txFeeInfo) return;

    const {
      fromAsset,
      toAsset,
      setTokenAllowance,
      provider,
    } = offerOrder;

    const transactionPayload = { ...this.transactionPayload };

    transactionPayload.txFeeInWei = txFeeInfo.fee;
    if (txFeeInfo.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

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


  handleBack = () => {
    const {
      setDismissTransaction,
      executingExchangeTransaction,
      navigation,
    } = this.props;
    if (executingExchangeTransaction) {
      setDismissTransaction();
    } else {
      navigation.goBack();
    }
  };

  render() {
    const { txFeeInfo, gettingFee } = this.state;
    const {
      navigation,
      session,
      balances,
      baseFiatCurrency,
      rates,
      theme,
    } = this.props;

    const offerOrder: OfferOrder = navigation.getParam('offerOrder', {});
    const {
      receiveQuantity,
      payQuantity,
      toAsset,
      fromAsset,
      provider,
    } = offerOrder;

    const { code: fromCode, symbol: fromAssetSymbol } = fromAsset;
    const { code: toCode, symbol: toAssetSymbol } = toAsset;
    const fromAssetCode = fromCode || fromAssetSymbol;
    const toAssetCode = toCode || toAssetSymbol;

    const feeSymbol = get(txFeeInfo?.gasToken, 'symbol', ETH);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const { decimals, amount, symbol } = this.transactionPayload;

    let isEnoughForFee = true;
    if (txFeeInfo) {
      isEnoughForFee = isEnoughBalanceForTransactionFee(balances, {
        amount,
        decimals,
        symbol,
        txFeeInWei: txFeeInfo.fee,
        gasToken: txFeeInfo.gasToken,
      });
    }

    const errorMessage = !isEnoughForFee && t('error.transactionFailed.notEnoughForGasWithBalance', {
      token: feeSymbol,
      balance: getBalance(balances, feeSymbol),
    });
    const formattedReceiveAmount = formatAmountDisplay(receiveQuantity);

    const receiveAmountInFiat = parseFloat(receiveQuantity) * getRate(rates, toAssetCode, fiatCurrency);
    const formattedReceiveAmountInFiat = formatFiat(receiveAmountInFiat, fiatCurrency);

    const providerLogo = getOfferProviderLogo(provider, theme, 'vertical');
    const confirmButtonTitle = gettingFee ? t('label.gettingFee') : t('button.confirm');

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('exchangeContent.title.confirmScreen') }],
          customOnBack: this.handleBack,
        }}
        inset={{ bottom: 'never' }}
      >
        <ScrollWrapper contentContainerStyle={{ minHeight: '100%' }}>
          <MainWrapper>
            <ExchangeScheme
              fromValue={payQuantity}
              fromAssetCode={fromAssetCode}
              toValue={formattedReceiveAmount}
              toValueInFiat={formattedReceiveAmountInFiat}
              toAssetCode={toAssetCode}
              imageSource={providerLogo}
            />
            <Spacing h={36} />
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
                  <TableFee txFeeInWei={txFeeInfo?.fee} gasToken={txFeeInfo?.gasToken} />
                </TableRow>
                <TableRow>
                  <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
                  <TableAmount amount={0} />
                </TableRow>
                <TableRow>
                  <TableLabel>{t('transactions.label.totalFee')}</TableLabel>
                  <TableFee txFeeInWei={txFeeInfo?.fee} gasToken={txFeeInfo?.gasToken} />
                </TableRow>
              </Table>
              <Spacing h={48} />
              <Button
                disabled={!session.isOnline || !!errorMessage || gettingFee}
                onPress={() => this.onConfirmTransactionPress(offerOrder)}
                title={confirmButtonTitle}
              />
            </TableWrapper>
          </MainWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  history: { gasInfo },
  exchange: { data: { executingTransaction: executingExchangeTransaction }, exchangeSupportedAssets },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  session,
  rates,
  baseFiatCurrency,
  gasInfo,
  executingExchangeTransaction,
  exchangeSupportedAssets,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
  isSmartAccount: isActiveAccountSmartWalletSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  setDismissTransaction: () => dispatch(setDismissTransactionAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeConfirmScreen));
